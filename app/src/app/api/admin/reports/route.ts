import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

const CAT_COLORS: Record<string, string> = {
  RENT:      '#ef4444',
  UTILITIES: '#eab308',
  INSURANCE: '#22c55e',
  SUPPLIES:  '#a855f7',
  FUEL:      '#f97316',
  EQUIPMENT: '#6b7280',
  MARKETING: '#ec4899',
  OTHER:     '#94a3b8',
}

const CAT_LABELS: Record<string, string> = {
  RENT: 'Rent', UTILITIES: 'Utilities', INSURANCE: 'Insurance',
  SUPPLIES: 'Supplies', FUEL: 'Fuel', EQUIPMENT: 'Equipment',
  MARKETING: 'Marketing', OTHER: 'Other',
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

export async function GET(req: NextRequest) {
  if (!(await getServerSession(authOptions))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const now = new Date()
  const fromStr = searchParams.get('from') ?? `${now.getFullYear()}-01-01`
  const toStr   = searchParams.get('to')   ?? now.toISOString().slice(0, 10)

  const fromDate = new Date(fromStr + 'T00:00:00.000Z')
  const toDate   = new Date(toStr   + 'T23:59:59.999Z')

  const [orders, payRecords, expenses] = await Promise.all([
    prisma.supplierOrder.findMany({
      where: { orderedAt: { gte: fromDate, lte: toDate }, status: { not: 'CANCELLED' } },
      select: { totalCost: true, orderedAt: true },
    }),
    prisma.payRecord.findMany({
      where: { paidAt: { gte: fromDate, lte: toDate } },
      select: { amount: true, type: true, paidAt: true },
    }),
    prisma.generalExpense.findMany({
      where: { paidAt: { gte: fromDate, lte: toDate } },
      select: { amount: true, category: true, paidAt: true },
    }),
  ])

  // Generate all months in range
  const months: string[] = []
  const cur = new Date(fromDate)
  cur.setUTCDate(1)
  while (cur <= toDate) {
    months.push(monthKey(cur))
    cur.setUTCMonth(cur.getUTCMonth() + 1)
  }

  // Per-month buckets
  type Bucket = { inventory: number; payroll: number; staffExp: number; overhead: number }
  const byMonthMap: Record<string, Bucket> = {}
  months.forEach((m) => { byMonthMap[m] = { inventory: 0, payroll: 0, staffExp: 0, overhead: 0 } })

  for (const o of orders) {
    const k = monthKey(new Date(o.orderedAt))
    if (byMonthMap[k]) byMonthMap[k].inventory += parseFloat(o.totalCost.toString())
  }

  for (const r of payRecords) {
    const k = monthKey(new Date(r.paidAt))
    if (!byMonthMap[k]) continue
    const amt = parseFloat(r.amount.toString())
    if (r.type === 'DEDUCTION')  byMonthMap[k].payroll  -= amt
    else if (r.type === 'EXPENSE') byMonthMap[k].staffExp += amt
    else                           byMonthMap[k].payroll  += amt
  }

  for (const e of expenses) {
    const k = monthKey(new Date(e.paidAt))
    if (byMonthMap[k]) byMonthMap[k].overhead += parseFloat(e.amount.toString())
  }

  const byMonth = months.map((m) => ({
    month: monthLabel(m),
    ...byMonthMap[m],
    total: byMonthMap[m].inventory + Math.max(0, byMonthMap[m].payroll) + byMonthMap[m].staffExp + byMonthMap[m].overhead,
  }))

  // Category totals
  const totalInventory = orders.reduce((s, o) => s + parseFloat(o.totalCost.toString()), 0)

  const netPayroll = payRecords.reduce((s, r) => {
    const amt = parseFloat(r.amount.toString())
    if (r.type === 'DEDUCTION')  return s - amt
    if (r.type === 'EXPENSE')    return s
    return s + amt
  }, 0)

  const totalStaffExp = payRecords
    .filter((r) => r.type === 'EXPENSE')
    .reduce((s, r) => s + parseFloat(r.amount.toString()), 0)

  const expByCat: Record<string, number> = {}
  for (const e of expenses) {
    expByCat[e.category] = (expByCat[e.category] ?? 0) + parseFloat(e.amount.toString())
  }

  const byCategory = [
    totalInventory > 0 ? { label: 'Inventory',     amount: totalInventory, color: '#3b82f6' } : null,
    netPayroll     > 0 ? { label: 'Payroll',        amount: netPayroll,     color: '#8b5cf6' } : null,
    totalStaffExp  > 0 ? { label: 'Staff Expenses', amount: totalStaffExp,  color: '#f59e0b' } : null,
    ...Object.entries(expByCat).map(([cat, amt]) => ({
      label: CAT_LABELS[cat] ?? cat,
      amount: amt,
      color: CAT_COLORS[cat] ?? '#94a3b8',
    })),
  ].filter(Boolean) as { label: string; amount: number; color: string }[]

  const total = byCategory.reduce((s, c) => s + c.amount, 0)

  return NextResponse.json({ total, byCategory, byMonth })
}
