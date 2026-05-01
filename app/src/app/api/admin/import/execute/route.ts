import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  fileName:      z.string().min(1),
  importType:    z.enum(['tires', 'orders']),
  columnMapping: z.record(z.string()),
  rows:          z.array(z.record(z.unknown())),
})

// ── Helpers ────────────────────────────────────────────────────────────────

function toStr(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v).trim()
}

function toNum(v: unknown): number | undefined {
  const s = toStr(v).replace(/[$,\s]/g, '')
  if (!s) return undefined
  const n = parseFloat(s)
  return isNaN(n) ? undefined : n
}

function toInt(v: unknown): number | undefined {
  const n = toNum(v)
  return n !== undefined ? Math.round(n) : undefined
}

function toDate(v: unknown): Date | null {
  if (!v) return null
  if (v instanceof Date) return v
  const d = new Date(toStr(v))
  return isNaN(d.getTime()) ? null : d
}

// Apply column mapping to a raw row
function applyMapping(
  row: Record<string, unknown>,
  mapping: Record<string, string>
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [sourceCol, targetField] of Object.entries(mapping)) {
    if (!targetField || targetField === '__skip__') continue
    out[targetField] = row[sourceCol]
  }
  return out
}

// ── Tire import ─────────────────────────────────────────────────────────────

async function importTireRow(raw: Record<string, unknown>) {
  const brand    = toStr(raw.brand)
  const model    = toStr(raw.model)
  const sku      = toStr(raw.sku) || null
  const width    = toInt(raw.width)
  const aspect   = toInt(raw.aspect)
  const diameter = toInt(raw.diameter)
  const quantity = toInt(raw.quantity) ?? 0
  const cost     = toNum(raw.cost)
  const price    = toNum(raw.price)
  const location = toStr(raw.location) || null
  const notes    = toStr(raw.notes) || null

  if (!brand || !model) throw new Error('Brand and model are required')
  if (cost === undefined || cost <= 0) throw new Error('Valid cost is required')
  if (price === undefined || price <= 0) throw new Error('Valid price is required')
  if ((width ?? 0) <= 0 || (aspect ?? 0) <= 0 || (diameter ?? 0) <= 0) {
    throw new Error('Valid tire size (width, aspect, diameter) is required')
  }

  const data = {
    brand,
    model,
    sku,
    width:    width!,
    aspect:   aspect!,
    diameter: diameter!,
    quantity: Math.max(0, quantity),
    cost,
    price,
    location,
    notes,
  }

  if (sku) {
    // Upsert by SKU
    await prisma.tire.upsert({
      where: { sku },
      update: data,
      create: data,
    })
  } else {
    // Try to find by brand + model + size
    const existing = await prisma.tire.findFirst({
      where: { brand, model, width: data.width, aspect: data.aspect, diameter: data.diameter },
    })
    if (existing) {
      await prisma.tire.update({ where: { id: existing.id }, data })
    } else {
      await prisma.tire.create({ data })
    }
  }
}

// ── Order import ────────────────────────────────────────────────────────────

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'RECEIVED', 'CANCELLED'] as const
type OrderStatus = (typeof VALID_STATUSES)[number]

async function importOrderRow(raw: Record<string, unknown>) {
  const supplier = toStr(raw.supplier)
  if (!supplier) throw new Error('Supplier name is required')

  const totalCost = toNum(raw.totalCost) ?? 0
  const rawStatus = toStr(raw.status).toUpperCase()
  const status: OrderStatus = VALID_STATUSES.includes(rawStatus as OrderStatus)
    ? (rawStatus as OrderStatus)
    : 'PENDING'

  const orderedAt  = toDate(raw.orderedAt) ?? new Date()
  const expectedAt = toDate(raw.expectedAt)

  await prisma.supplierOrder.create({
    data: {
      supplier,
      orderNumber: toStr(raw.orderNumber) || null,
      items:       [],
      totalCost,
      status,
      orderedAt,
      expectedAt,
      notes: toStr(raw.notes) || null,
    },
  })
}

// ── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = schema.parse(await req.json())
    const { fileName, importType, columnMapping, rows } = body

    let rowsSuccess = 0
    let rowsError   = 0
    const errors: Array<{ row: number; error: string }> = []

    for (let i = 0; i < rows.length; i++) {
      const mapped = applyMapping(rows[i], columnMapping)
      try {
        if (importType === 'tires') {
          await importTireRow(mapped)
        } else {
          await importOrderRow(mapped)
        }
        rowsSuccess++
      } catch (err) {
        rowsError++
        errors.push({
          row:   i + 2, // +2 because row 1 is headers, 0-indexed
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    // Save import job record
    const job = await prisma.importJob.create({
      data: {
        fileName,
        importType,
        status:        rowsError === rows.length ? 'FAILED' : 'COMPLETED',
        rowsProcessed: rows.length,
        rowsSuccess,
        rowsError,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        errors:        errors as any,
        uploadedBy:    session.user?.email ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        columnMapping: columnMapping as any,
      },
    })

    return NextResponse.json({ job, rowsProcessed: rows.length, rowsSuccess, rowsError, errors })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 })
    }
    console.error('Import execute error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
