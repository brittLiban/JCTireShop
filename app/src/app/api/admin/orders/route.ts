import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const itemSchema = z.object({
  name: z.string().min(1),
  qty: z.number().positive(),
  unitCost: z.number().positive(),
})

const schema = z.object({
  supplier: z.string().min(1).max(100),
  orderNumber: z.string().max(100).optional(),
  items: z.array(itemSchema),
  totalCost: z.coerce.number().positive(),
  status: z
    .enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'RECEIVED', 'CANCELLED'])
    .default('PENDING'),
  expectedAt: z.string().nullable().optional(),
  notes: z.string().max(1000).optional(),
})

async function requireAuth() {
  return await getServerSession(authOptions)
}

export async function GET() {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const orders = await prisma.supplierOrder.findMany({
    orderBy: { orderedAt: 'desc' },
  })
  return NextResponse.json(orders)
}

export async function POST(req: NextRequest) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = schema.parse(await req.json())
    const order = await prisma.supplierOrder.create({
      data: {
        supplier: body.supplier,
        orderNumber: body.orderNumber,
        items: body.items,
        totalCost: body.totalCost,
        status: body.status,
        expectedAt: body.expectedAt ? new Date(body.expectedAt) : null,
        notes: body.notes,
      },
    })
    return NextResponse.json(order, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
