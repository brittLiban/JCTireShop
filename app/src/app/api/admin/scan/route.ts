import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

const schema = z.object({
  scannedValue: z.string().max(200).transform((value) => value.trim()).refine(Boolean, 'Required'),
  scanType: z.enum(['RECEIVE', 'REMOVE', 'AUDIT']),
  qty: z.coerce.number().int().positive().default(1),
})

const tireInclude = {
  container: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.TireInclude

// Parse "225/65R17", "225 65 17", "22565R17", or "2256517".
function parseTireSize(s: string): { width: number; aspect: number; diameter: number } | null {
  const compact = s.trim().match(/^(\d{3})(\d{2})[rR]?(\d{2})$/)
  const parts = compact
    ? compact.slice(1).map(Number)
    : s
        .replace(/[rR]/g, ' ')
        .replace(/[/,]/g, ' ')
        .trim()
        .split(/\s+/)
        .map(Number)
        .filter((n) => !isNaN(n) && n > 0)

  if (parts.length !== 3) return null
  const [width, aspect, diameter] = parts

  if (width < 100 || width > 400) return null
  if (aspect < 20 || aspect > 100) return null
  if (diameter < 10 || diameter > 30) return null
  return { width, aspect, diameter }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = schema.parse(await req.json())
    const { scannedValue, scanType, qty } = body
    const userEmail = session.user?.email ?? undefined

    const outcome = await prisma.$transaction(async (tx) => {
      let tire = await tx.tire.findUnique({
        where: { sku: scannedValue },
        include: tireInclude,
      })

      let ambiguous = false
      if (!tire) {
        const size = parseTireSize(scannedValue)
        if (size) {
          const matches = await tx.tire.findMany({
            where: size,
            include: tireInclude,
          })
          if (matches.length === 1) {
            tire = matches[0]
          } else if (matches.length > 1) {
            ambiguous = true
          }
        }
      }

      if (!tire) {
        const errorMessage = ambiguous
          ? `Multiple tires match "${scannedValue}" - scan a specific SKU`
          : `No tire found for "${scannedValue}"`

        await tx.scanLog.create({
          data: {
            scannedValue,
            scanType,
            userEmail,
            success: false,
            errorMessage,
          },
        })

        return {
          status: 404,
          body: {
            success: false,
            error: ambiguous
              ? 'Multiple tires match that size - assign SKUs to distinguish them'
              : 'Unknown barcode - no tire found in inventory',
          },
        }
      }

      const qtyBefore = tire.quantity

      if (scanType === 'AUDIT') {
        await tx.scanLog.create({
          data: {
            tireId: tire.id,
            scannedValue,
            scanType,
            userEmail,
            qtyBefore,
            qtyAfter: qtyBefore,
            success: true,
          },
        })

        return {
          status: 200,
          body: {
            success: true,
            tire,
            qtyBefore,
            qtyAfter: qtyBefore,
            delta: 0,
          },
        }
      }

      if (scanType === 'RECEIVE') {
        const updatedTire = await tx.tire.update({
          where: { id: tire.id },
          data: { quantity: { increment: qty } },
          include: tireInclude,
        })
        const qtyAfter = updatedTire.quantity

        await tx.scanLog.create({
          data: {
            tireId: tire.id,
            scannedValue,
            scanType,
            userEmail,
            qtyBefore,
            qtyAfter,
            success: true,
          },
        })

        return {
          status: 200,
          body: {
            success: true,
            tire: updatedTire,
            qtyBefore,
            qtyAfter,
            delta: qtyAfter - qtyBefore,
          },
        }
      }

      if (qtyBefore < qty) {
        const error = qtyBefore === 0
          ? 'Tire is already out of stock'
          : 'Not enough stock to remove requested quantity'

        await tx.scanLog.create({
          data: {
            tireId: tire.id,
            scannedValue,
            scanType,
            userEmail,
            qtyBefore,
            qtyAfter: qtyBefore,
            success: false,
            errorMessage: `Requested ${qty}, only ${qtyBefore} available`,
          },
        })

        return {
          status: 409,
          body: {
            success: false,
            error,
            currentQuantity: qtyBefore,
            requestedQuantity: qty,
            tire,
          },
        }
      }

      const update = await tx.tire.updateMany({
        where: {
          id: tire.id,
          quantity: { gte: qty },
        },
        data: {
          quantity: { decrement: qty },
        },
      })

      if (update.count !== 1) {
        const currentTire = await tx.tire.findUniqueOrThrow({
          where: { id: tire.id },
          include: tireInclude,
        })

        await tx.scanLog.create({
          data: {
            tireId: tire.id,
            scannedValue,
            scanType,
            userEmail,
            qtyBefore: currentTire.quantity,
            qtyAfter: currentTire.quantity,
            success: false,
            errorMessage: `Requested ${qty}, only ${currentTire.quantity} available`,
          },
        })

        return {
          status: 409,
          body: {
            success: false,
            error: currentTire.quantity === 0
              ? 'Tire is already out of stock'
              : 'Not enough stock to remove requested quantity',
            currentQuantity: currentTire.quantity,
            requestedQuantity: qty,
            tire: currentTire,
          },
        }
      }

      const updatedTire = await tx.tire.findUniqueOrThrow({
        where: { id: tire.id },
        include: tireInclude,
      })
      const qtyAfter = updatedTire.quantity

      await tx.scanLog.create({
        data: {
          tireId: tire.id,
          scannedValue,
          scanType,
          userEmail,
          qtyBefore,
          qtyAfter,
          success: true,
        },
      })

      return {
        status: 200,
        body: {
          success: true,
          tire: updatedTire,
          qtyBefore,
          qtyAfter,
          delta: qtyAfter - qtyBefore,
        },
      }
    })

    return NextResponse.json(outcome.body, { status: outcome.status })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
