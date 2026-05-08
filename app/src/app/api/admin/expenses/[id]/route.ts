import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  name:        z.string().min(1).max(100).optional(),
  category:    z.string().max(50).optional(),
  amount:      z.coerce.number().positive().optional(),
  isRecurring: z.boolean().optional(),
  recurDay:    z.coerce.number().int().min(1).max(31).optional().nullable(),
  notes:       z.string().max(500).optional().nullable(),
  paidAt:      z.string().optional().nullable(),
})

async function requireAuth() {
  return await getServerSession(authOptions)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = schema.parse(await req.json())
    const expense = await prisma.generalExpense.update({
      where: { id: params.id },
      data: {
        ...body,
        recurDay: body.isRecurring === false ? null : body.recurDay,
        paidAt:   body.paidAt ? new Date(body.paidAt) : undefined,
      },
    })
    return NextResponse.json(expense)
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 })
    console.error(err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await prisma.generalExpense.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
