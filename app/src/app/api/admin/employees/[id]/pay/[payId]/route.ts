import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function requireAuth() {
  return await getServerSession(authOptions)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; payId: string } }
) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await prisma.payRecord.delete({ where: { id: params.payId, employeeId: params.id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
