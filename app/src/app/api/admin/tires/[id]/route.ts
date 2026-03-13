import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  brand: z.string().min(1).max(100).optional(),
  model: z.string().min(1).max(100).optional(),
  width: z.coerce.number().int().positive().optional(),
  aspect: z.coerce.number().int().positive().optional(),
  diameter: z.coerce.number().int().positive().optional(),
  quantity: z.coerce.number().int().min(0).optional(),
  cost: z.coerce.number().positive().optional(),
  price: z.coerce.number().positive().optional(),
  notes: z.string().max(500).optional(),
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
    const tire = await prisma.tire.update({
      where: { id: params.id },
      data: body,
    })
    return NextResponse.json(tire)
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
    await prisma.tire.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
