import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  brand: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  width: z.coerce.number().int().positive(),
  aspect: z.coerce.number().int().positive(),
  diameter: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(0),
  cost: z.coerce.number().positive(),
  price: z.coerce.number().positive(),
  location: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
})

async function requireAuth() {
  const session = await getServerSession(authOptions)
  return session
}

export async function GET() {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tires = await prisma.tire.findMany({ orderBy: [{ brand: 'asc' }, { model: 'asc' }] })
  return NextResponse.json(tires)
}

export async function POST(req: NextRequest) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = schema.parse(await req.json())
    const tire = await prisma.tire.create({ data: body })
    return NextResponse.json(tire, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
