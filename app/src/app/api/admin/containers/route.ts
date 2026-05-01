import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  name:     z.string().min(1, 'Name is required').max(100),
  notes:    z.string().max(500).optional().nullable(),
  capacity: z.coerce.number().int().positive().optional().nullable(),
})

async function requireAuth() {
  return await getServerSession(authOptions)
}

export async function GET() {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const containers = await prisma.container.findMany({
    include: { _count: { select: { tires: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(containers)
}

export async function POST(req: NextRequest) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = schema.parse(await req.json())
    const container = await prisma.container.create({ data: body })
    return NextResponse.json(container, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
