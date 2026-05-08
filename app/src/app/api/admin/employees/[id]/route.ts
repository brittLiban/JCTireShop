import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  name:      z.string().min(1).max(100).optional(),
  role:      z.string().max(100).optional().nullable(),
  phone:     z.string().max(30).optional().nullable(),
  email:     z.string().email().max(200).optional().nullable().or(z.literal('')),
  payType:   z.enum(['HOURLY', 'SALARY']).optional(),
  payRate:   z.coerce.number().positive().optional(),
  startDate: z.string().optional().nullable(),
  status:    z.enum(['ACTIVE', 'INACTIVE']).optional(),
  notes:     z.string().max(500).optional().nullable(),
})

async function requireAuth() {
  return await getServerSession(authOptions)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = schema.parse(await req.json())
    const employee = await prisma.employee.update({
      where: { id: params.id },
      data: {
        ...body,
        email:     body.email === '' ? null : body.email,
        startDate: body.startDate !== undefined
          ? body.startDate ? new Date(body.startDate) : null
          : undefined,
      },
      include: { payRecords: { orderBy: { paidAt: 'desc' } } },
    })
    return NextResponse.json(employee)
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 })
    console.error(err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await prisma.employee.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
