import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  name:        z.string().min(1).max(100),
  category:    z.string().max(50).default('OTHER'),
  amount:      z.coerce.number().positive(),
  isRecurring: z.boolean().default(false),
  recurDay:    z.coerce.number().int().min(1).max(31).optional().nullable(),
  notes:       z.string().max(500).optional().nullable(),
  paidAt:      z.string().optional(),
})

async function requireAuth() {
  return await getServerSession(authOptions)
}

export async function GET() {
  if (!(await requireAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const expenses = await prisma.generalExpense.findMany({
    orderBy: [{ isRecurring: 'desc' }, { paidAt: 'desc' }],
  })
  return NextResponse.json(expenses)
}

export async function POST(req: NextRequest) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = schema.parse(await req.json())
    const expense = await prisma.generalExpense.create({
      data: {
        name:        body.name,
        category:    body.category,
        amount:      body.amount,
        isRecurring: body.isRecurring,
        recurDay:    body.isRecurring ? (body.recurDay ?? null) : null,
        notes:       body.notes ?? null,
        paidAt:      body.paidAt ? new Date(body.paidAt) : new Date(),
      },
    })
    return NextResponse.json(expense, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 })
    console.error(err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
