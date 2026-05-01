import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit  = Math.min(parseInt(searchParams.get('limit')  ?? '50'), 200)
  const offset = parseInt(searchParams.get('offset') ?? '0')
  const scanType = searchParams.get('scanType') as 'RECEIVE' | 'REMOVE' | 'AUDIT' | null
  const successParam = searchParams.get('success')
  const from = searchParams.get('from')
  const to   = searchParams.get('to')

  const where: Prisma.ScanLogWhereInput = {}
  if (scanType) where.scanType = scanType
  if (successParam !== null) where.success = successParam === 'true'
  if (from || to) {
    where.createdAt = {}
    if (from) (where.createdAt as Prisma.DateTimeFilter).gte = new Date(from)
    if (to)   (where.createdAt as Prisma.DateTimeFilter).lte = new Date(to)
  }

  const [logs, total] = await Promise.all([
    prisma.scanLog.findMany({
      where,
      include: {
        tire: {
          select: {
            brand: true,
            model: true,
            width: true,
            aspect: true,
            diameter: true,
            sku: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.scanLog.count({ where }),
  ])

  return NextResponse.json({ logs, total, limit, offset })
}
