import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  type:        z.enum(['PAYROLL', 'BONUS', 'EXPENSE', 'DEDUCTION']).default('PAYROLL'),
  amount:      z.coerce.number().positive(),
  hours:       z.coerce.number().positive().optional().nullable(),
  periodStart: z.string().optional().nullable(),
  periodEnd:   z.string().optional().nullable(),
  paidAt:      z.string().optional(),
  notes:       z.string().max(500).optional().nullable(),
})

async function requireAuth() {
  return await getServerSession(authOptions)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = schema.parse(await req.json())
    const record = await prisma.payRecord.create({
      data: {
        employeeId:  params.id,
        type:        body.type,
        amount:      body.amount,
        hours:       body.hours ?? null,
        periodStart: body.periodStart ? new Date(body.periodStart) : null,
        periodEnd:   body.periodEnd   ? new Date(body.periodEnd)   : null,
        paidAt:      body.paidAt ? new Date(body.paidAt) : new Date(),
        notes:       body.notes ?? null,
      },
    })
    return NextResponse.json(record, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 })
    console.error(err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
