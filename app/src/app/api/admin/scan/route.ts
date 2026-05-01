import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  scannedValue: z.string().min(1).max(200),
  scanType: z.enum(['RECEIVE', 'REMOVE', 'AUDIT']),
  qty: z.coerce.number().int().positive().default(1),
})

// Parse "225/65R17", "225 65 17", "22565r17" etc. with sanity checks
function parseTireSize(s: string): { width: number; aspect: number; diameter: number } | null {
  const clean = s.replace(/[rR]/g, ' ').replace(/[/,]/g, ' ').trim()
  const parts = clean.split(/\s+/).map(Number).filter((n) => !isNaN(n) && n > 0)
  if (parts.length !== 3) return null
  const [width, aspect, diameter] = parts
  // Sanity ranges for real tire sizes
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

    // 1. Try exact SKU match
    let tire = await prisma.tire.findUnique({ where: { sku: scannedValue } })

    // 2. Try to parse as tire size (fallback)
    let ambiguous = false
    if (!tire) {
      const size = parseTireSize(scannedValue)
      if (size) {
        const matches = await prisma.tire.findMany({ where: size })
        if (matches.length === 1) {
          tire = matches[0]
        } else if (matches.length > 1) {
          ambiguous = true
        }
      }
    }

    // Not found — log and return error
    if (!tire) {
      await prisma.scanLog.create({
        data: {
          scannedValue,
          scanType,
          userEmail: session.user?.email ?? undefined,
          success: false,
          errorMessage: ambiguous
            ? `Multiple tires match "${scannedValue}" — scan a specific SKU`
            : `No tire found for "${scannedValue}"`,
        },
      })
      return NextResponse.json(
        {
          success: false,
          error: ambiguous
            ? 'Multiple tires match that size — assign SKUs to distinguish them'
            : 'Unknown barcode — no tire found in inventory',
        },
        { status: 404 }
      )
    }

    const qtyBefore = tire.quantity
    let qtyAfter = qtyBefore

    // REMOVE: block if already at 0
    if (scanType === 'REMOVE' && qtyBefore === 0) {
      await prisma.scanLog.create({
        data: {
          tireId: tire.id,
          scannedValue,
          scanType,
          userEmail: session.user?.email ?? undefined,
          qtyBefore: 0,
          qtyAfter: 0,
          success: false,
          errorMessage: 'Tire is out of stock — cannot remove',
        },
      })
      return NextResponse.json(
        { success: false, error: 'Tire is already out of stock', tire },
        { status: 409 }
      )
    }

    if (scanType === 'RECEIVE') {
      qtyAfter = qtyBefore + qty
    } else if (scanType === 'REMOVE') {
      qtyAfter = Math.max(0, qtyBefore - qty)
    }
    // AUDIT: qtyAfter stays the same as qtyBefore

    // Update tire quantity (not for AUDIT)
    if (scanType !== 'AUDIT') {
      await prisma.tire.update({
        where: { id: tire.id },
        data: { quantity: qtyAfter },
      })
    }

    // Log the scan
    await prisma.scanLog.create({
      data: {
        tireId: tire.id,
        scannedValue,
        scanType,
        userEmail: session.user?.email ?? undefined,
        qtyBefore,
        qtyAfter,
        success: true,
      },
    })

    const updatedTire = { ...tire, quantity: qtyAfter }

    return NextResponse.json({
      success: true,
      tire: updatedTire,
      qtyBefore,
      qtyAfter,
      delta: qtyAfter - qtyBefore,
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
