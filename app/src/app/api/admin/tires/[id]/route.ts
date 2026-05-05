import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

const nullableText = (max: number) =>
  z.union([z.string().max(max), z.null(), z.undefined()]).transform((value) => {
    if (value === undefined) return undefined
    if (value === null) return null
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  })

const tireInclude = {
  container: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.TireInclude

const schema = z.object({
  sku:         nullableText(100),
  brand:       z.string().min(1).max(100).optional(),
  model:       z.string().min(1).max(100).optional(),
  width:       z.coerce.number().int().positive().optional(),
  aspect:      z.coerce.number().int().positive().optional(),
  diameter:    z.coerce.number().int().positive().optional(),
  quantity:    z.coerce.number().int().min(0).optional(),
  cost:        z.coerce.number().positive().optional(),
  price:       z.coerce.number().positive().optional(),
  location:    nullableText(100),
  notes:       nullableText(500),
  containerId: nullableText(100),
})

async function requireAuth() {
  return await getServerSession(authOptions)
}

function prismaErrorResponse(err: unknown) {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return null

  if (err.code === 'P2002') {
    const target = Array.isArray(err.meta?.target)
      ? err.meta.target.map(String).join(', ')
      : String(err.meta?.target ?? '')
    const field = target.toLowerCase().includes('sku') ? 'SKU / barcode' : 'Unique field'

    return NextResponse.json(
      { error: `${field} already exists. Use a unique value.` },
      { status: 409 }
    )
  }

  if (err.code === 'P2003') {
    return NextResponse.json(
      { error: 'Selected container was not found.' },
      { status: 400 }
    )
  }

  if (err.code === 'P2025') {
    return NextResponse.json({ error: 'Tire not found.' }, { status: 404 })
  }

  return null
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
      include: tireInclude,
    })
    return NextResponse.json(tire)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 })
    }
    const mappedError = prismaErrorResponse(err)
    if (mappedError) return mappedError
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
    const mappedError = prismaErrorResponse(err)
    if (mappedError) return mappedError
    console.error(err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
