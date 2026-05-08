import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  name:      z.string().min(1).max(100),
  role:      z.string().max(100).optional().nullable(),
  phone:     z.string().max(30).optional().nullable(),
  email:     z.string().email().max(200).optional().nullable().or(z.literal('')),
  payType:   z.enum(['HOURLY', 'SALARY']).default('HOURLY'),
  payRate:   z.coerce.number().positive(),
  startDate: z.string().optional().nullable(),
  status:    z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  notes:     z.string().max(500).optional().nullable(),
})

async function requireAuth() {
  return await getServerSession(authOptions)
}

export async function GET() {
  if (!(await requireAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const employees = await prisma.employee.findMany({
    orderBy: { name: 'asc' },
    include: { payRecords: { orderBy: { paidAt: 'desc' } } },
  })
  return NextResponse.json(employees)
}

export async function POST(req: NextRequest) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = schema.parse(await req.json())
    const employee = await prisma.employee.create({
      data: {
        ...body,
        email:     body.email || null,
        startDate: body.startDate ? new Date(body.startDate) : null,
      },
      include: { payRecords: true },
    })
    return NextResponse.json(employee, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 })
    console.error(err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
