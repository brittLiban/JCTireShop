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
  brand:       z.string().min(1).max(100),
  model:       z.string().min(1).max(100),
  width:       z.coerce.number().int().positive(),
  aspect:      z.coerce.number().int().positive(),
  diameter:    z.coerce.number().int().positive(),
  quantity:    z.coerce.number().int().min(0),
  cost:        z.coerce.number().positive(),
  price:       z.coerce.number().positive(),
  location:    nullableText(100),
  notes:       nullableText(500),
  containerId: nullableText(100),
})

async function requireAuth() {
  const session = await getServerSession(authOptions)
  return session
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

  return null
}

export async function GET() {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tires = await prisma.tire.findMany({
    include: tireInclude,
    orderBy: [{ brand: 'asc' }, { model: 'asc' }],
  })
  return NextResponse.json(tires)
}

export async function POST(req: NextRequest) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = schema.parse(await req.json())

    const duplicate = await prisma.tire.findFirst({
      where: {
        brand:    { equals: body.brand,    mode: 'insensitive' },
        model:    { equals: body.model,    mode: 'insensitive' },
        width:    body.width,
        aspect:   body.aspect,
        diameter: body.diameter,
      },
    })
    if (duplicate) {
      return NextResponse.json(
        { error: `${body.brand} ${body.model} ${body.width}/${body.aspect}R${body.diameter} already exists in inventory.` },
        { status: 409 }
      )
    }

    const tire = await prisma.tire.create({
      data: body,
      include: tireInclude,
    })
    return NextResponse.json(tire, { status: 201 })
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
