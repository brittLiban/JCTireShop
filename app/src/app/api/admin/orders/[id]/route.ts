import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  supplier: z.string().min(1).max(100).optional(),
  orderNumber: z.string().max(100).optional(),
  items: z
    .array(z.object({ name: z.string(), qty: z.number(), unitCost: z.number() }))
    .optional(),
  totalCost: z.coerce.number().positive().optional(),
  status: z
    .enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'RECEIVED', 'CANCELLED'])
    .optional(),
  expectedAt: z.string().nullable().optional(),
  receivedAt: z.string().nullable().optional(),
  notes: z.string().max(1000).optional(),
})

async function requireAuth() {
  return await getServerSession(authOptions)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = schema.parse(await req.json())
    const order = await prisma.supplierOrder.update({
      where: { id: params.id },
      data: {
        ...body,
        expectedAt: body.expectedAt !== undefined
          ? body.expectedAt ? new Date(body.expectedAt) : null
          : undefined,
        receivedAt: body.receivedAt !== undefined
          ? body.receivedAt ? new Date(body.receivedAt) : null
          : undefined,
      },
    })
    return NextResponse.json(order)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await prisma.supplierOrder.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
