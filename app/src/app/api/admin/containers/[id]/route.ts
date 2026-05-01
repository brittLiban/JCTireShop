import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  name:     z.string().min(1).max(100).optional(),
  notes:    z.string().max(500).optional().nullable(),
  capacity: z.coerce.number().int().positive().optional().nullable(),
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
    const container = await prisma.container.update({
      where: { id: params.id },
      data: body,
    })
    return NextResponse.json(container)
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
    const container = await prisma.container.findUnique({
      where: { id: params.id },
      include: { _count: { select: { tires: true } } },
    })
    if (!container) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (container._count.tires > 0) {
      return NextResponse.json(
        { error: `Cannot delete — ${container._count.tires} tire(s) still assigned. Reassign them first.` },
        { status: 409 }
      )
    }
    await prisma.container.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
