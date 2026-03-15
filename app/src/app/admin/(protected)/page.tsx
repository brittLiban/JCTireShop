export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { BarFill } from '@/components/BarFill'
import {
  Package, Truck, MessageSquare, AlertTriangle,
  DollarSign, TrendingUp, Clock, CheckCircle2, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import Link from 'next/link'

const STATUS_COLOR: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100   text-blue-700',
  SHIPPED:   'bg-purple-100 text-purple-700',
  RECEIVED:  'bg-green-100  text-green-700',
  CANCELLED: 'bg-gray-100   text-gray-500',
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtShort(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`
  return `$${fmt(n)}`
}

function monthLabel(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

export default async function AdminDashboard() {
  const now = new Date()

  // Build date ranges for last 6 months
  const months: { start: Date; end: Date; label: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
    months.push({ start, end, label: monthLabel(start) })
  }

  const thisMonthStart = months[5].start
  const lastMonthStart = months[4].start
  const lastMonthEnd   = months[4].end

  const [
    totalTires,
    unreadMessages,
    lowStockTires,
    recentMessages,
    allOrders,
    tireInventory,
    thisMonthOrders,
    lastMonthOrders,
  ] = await Promise.all([
    prisma.tire.count(),
    prisma.contactSubmission.count({ where: { read: false } }),
    prisma.tire.findMany({
      where: { quantity: { lte: 4 } },
      select: { brand: true, model: true, width: true, aspect: true, diameter: true, quantity: true, location: true },
    }),
    prisma.contactSubmission.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
    prisma.supplierOrder.findMany({
      orderBy: { orderedAt: 'desc' },
      select: { id: true, supplier: true, totalCost: true, status: true, orderedAt: true, orderNumber: true, items: true },
    }),
    prisma.tire.findMany({ select: { quantity: true, cost: true, price: true } }),
    prisma.supplierOrder.findMany({
      where: { orderedAt: { gte: thisMonthStart } },
      select: { totalCost: true, supplier: true },
    }),
    prisma.supplierOrder.findMany({
      where: { orderedAt: { gte: lastMonthStart, lte: lastMonthEnd } },
      select: { totalCost: true },
    }),
  ])

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalSpent    = allOrders.reduce((s, o) => s + Number(o.totalCost), 0)
  const outstanding   = allOrders.filter((o) => ['PENDING','CONFIRMED','SHIPPED'].includes(o.status)).reduce((s, o) => s + Number(o.totalCost), 0)
  const thisMonthSpend = thisMonthOrders.reduce((s, o) => s + Number(o.totalCost), 0)
  const lastMonthSpend = lastMonthOrders.reduce((s, o) => s + Number(o.totalCost), 0)
  const momDelta      = lastMonthSpend > 0 ? ((thisMonthSpend - lastMonthSpend) / lastMonthSpend) * 100 : null
  const totalOrders   = allOrders.length
  const pendingOrders = allOrders.filter((o) => ['PENDING','CONFIRMED','SHIPPED'].includes(o.status)).length

  const inventoryCostValue   = tireInventory.reduce((s, t) => s + Number(t.cost)  * t.quantity, 0)
  const inventoryRetailValue = tireInventory.reduce((s, t) => s + Number(t.price) * t.quantity, 0)
  const totalUnits           = tireInventory.reduce((s, t) => s + t.quantity, 0)

  // ── Spend by supplier ─────────────────────────────────────────────────────
  const supplierMap: Record<string, number> = {}
  for (const o of allOrders) {
    supplierMap[o.supplier] = (supplierMap[o.supplier] ?? 0) + Number(o.totalCost)
  }
  const supplierSpend = Object.entries(supplierMap)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)
  const maxSupplierSpend = supplierSpend[0]?.total ?? 1

  // ── What we buy from each vendor (latest order items) ────────────────────
  const vendorItems: Record<string, string[]> = {}
  for (const o of allOrders) {
    if (!vendorItems[o.supplier]) vendorItems[o.supplier] = []
    const items = o.items as { name?: string }[]
    if (Array.isArray(items)) {
      items.forEach((item) => {
        if (item?.name && !vendorItems[o.supplier].includes(item.name)) {
          vendorItems[o.supplier].push(item.name)
        }
      })
    }
  }

  // ── MoM spend per month (last 6 months) ───────────────────────────────────
  const monthlySpend = await Promise.all(
    months.map(async ({ start, end, label }) => {
      const orders = await prisma.supplierOrder.findMany({
        where: { orderedAt: { gte: start, lte: end } },
        select: { totalCost: true },
      })
      const total = orders.reduce((s, o) => s + Number(o.totalCost), 0)
      return { label, total }
    })
  )
  const maxMonthly = Math.max(...monthlySpend.map((m) => m.total), 1)

  // ── Order status breakdown ────────────────────────────────────────────────
  const statusMap: Record<string, number> = {}
  for (const o of allOrders) statusMap[o.status] = (statusMap[o.status] ?? 0) + 1

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-brand-dark">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">JC Tire Shop — business overview</p>
        </div>
        <div className="text-right text-xs text-gray-400">
          <p className="font-medium text-gray-600">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Active orders banner */}
      {pendingOrders > 0 && (
        <div className="bg-brand-red/5 border border-brand-red/20 rounded-2xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Clock size={15} className="text-brand-red" />
            <span className="font-medium text-brand-dark">
              {pendingOrders} supplier order{pendingOrders > 1 ? 's' : ''} in progress
            </span>
          </div>
          <Link href="/admin/orders" className="text-brand-red text-sm font-semibold hover:underline">View →</Link>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Spent',
            value: `$${fmt(totalSpent)}`,
            sub: 'all supplier orders',
            icon: DollarSign,
            color: 'text-emerald-600 bg-emerald-50',
            href: '/admin/orders',
            badge: null,
          },
          {
            label: 'This Month',
            value: `$${fmt(thisMonthSpend)}`,
            sub: `vs $${fmt(lastMonthSpend)} last month`,
            icon: TrendingUp,
            color: 'text-orange-600 bg-orange-50',
            href: '/admin/orders',
            badge: momDelta,
          },
          {
            label: 'Outstanding',
            value: `$${fmt(outstanding)}`,
            sub: `${pendingOrders} orders pending / transit`,
            icon: Truck,
            color: outstanding > 0 ? 'text-red-600 bg-red-50' : 'text-gray-400 bg-gray-50',
            href: '/admin/orders',
            badge: null,
          },
          {
            label: 'Inventory Value',
            value: `$${fmt(inventoryCostValue)}`,
            sub: `cost · ${totalUnits} units · ${totalTires} SKUs`,
            icon: Package,
            color: 'text-purple-600 bg-purple-50',
            href: '/admin/inventory',
            badge: null,
          },
        ].map(({ label, value, sub, icon: Icon, color, href, badge }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={18} />
              </div>
              {badge !== null && badge !== undefined && (
                <span className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${badge >= 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {badge >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                  {Math.abs(badge).toFixed(0)}%
                </span>
              )}
            </div>
            <p className="text-2xl font-black text-brand-dark leading-tight">{value}</p>
            <p className="text-gray-400 text-xs mt-1 leading-snug">{label}</p>
            <p className="text-gray-400 text-xs leading-snug">{sub}</p>
          </Link>
        ))}
      </div>

      {/* MoM Spend chart + Order status */}
      <div className="grid lg:grid-cols-5 gap-6">

        {/* 6-month spend bar chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-brand-dark">Monthly Spend</h2>
              <p className="text-gray-400 text-xs mt-0.5">Supplier costs — last 6 months</p>
            </div>
            {momDelta !== null && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${momDelta >= 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {momDelta >= 0 ? '▲' : '▼'} {Math.abs(momDelta).toFixed(0)}% MoM
              </span>
            )}
          </div>

          {maxMonthly <= 1 ? (
            <div className="py-10 text-center text-gray-400 text-sm">No order data yet. Create supplier orders to see trends.</div>
          ) : (
            <div className="flex items-end gap-3 h-40">
              {monthlySpend.map(({ label, total }, i) => {
                const pct = Math.max(total > 0 ? 6 : 0, Math.round((total / maxMonthly) * 100))
                const isCurrent = i === 5
                return (
                  <div key={label} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[10px] text-gray-500 font-medium">{total > 0 ? fmtShort(total) : ''}</span>
                    <div className="w-full bg-gray-100 rounded-t-lg relative overflow-hidden h-24">
                      <BarFill
                        pct={pct}
                        className={`absolute bottom-0 left-0 right-0 rounded-t-lg transition-all duration-700 ${isCurrent ? 'bg-brand-red' : 'bg-gray-300'}`}
                        vertical
                      />
                    </div>
                    <span className={`text-[10px] font-semibold ${isCurrent ? 'text-brand-red' : 'text-gray-400'}`}>{label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Order status */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-brand-dark mb-1">Order Status</h2>
          <p className="text-gray-400 text-xs mb-5">All {totalOrders} supplier orders</p>

          {totalOrders === 0 ? (
            <p className="text-gray-400 text-sm py-6 text-center">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {(['PENDING','CONFIRMED','SHIPPED','RECEIVED','CANCELLED'] as const).map((s) => {
                const count = statusMap[s] ?? 0
                const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0
                return (
                  <div key={s} className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-24 text-center flex-shrink-0 ${STATUS_COLOR[s]}`}>
                      {s}
                    </span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <BarFill pct={count > 0 ? Math.max(4, pct) : 0} className="h-full bg-brand-dark rounded-full" />
                    </div>
                    <span className="text-sm font-bold text-brand-dark w-5 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Inventory at cost</span>
              <span className="font-semibold">${fmt(inventoryCostValue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Inventory at retail</span>
              <span className="font-semibold text-emerald-600">${fmt(inventoryRetailValue)}</span>
            </div>
            <div className="flex justify-between text-sm pt-1 border-t border-gray-100">
              <span className="text-gray-500 font-medium">Margin potential</span>
              <span className="font-bold text-emerald-600">${fmt(inventoryRetailValue - inventoryCostValue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spend by Supplier — with item breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-brand-dark">Spend by Vendor</h2>
            <p className="text-gray-400 text-xs mt-0.5">Total spend + items ordered per supplier</p>
          </div>
          <Link href="/admin/orders" className="text-brand-red text-xs font-semibold hover:underline">All orders →</Link>
        </div>

        {supplierSpend.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">
            No supplier orders yet.{' '}
            <Link href="/admin/orders" className="text-brand-red font-semibold hover:underline">Create your first order →</Link>
          </div>
        ) : (
          <div className="space-y-5">
            {supplierSpend.map(({ name, total }) => {
              const pct = Math.max(4, Math.round((total / maxSupplierSpend) * 100))
              const items = vendorItems[name] ?? []
              const orderCount = allOrders.filter((o) => o.supplier === name).length
              return (
                <div key={name}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-brand-dark truncate">{name}</span>
                        <span className="text-gray-400 text-xs flex-shrink-0">{orderCount} order{orderCount !== 1 ? 's' : ''}</span>
                      </div>
                      {items.length > 0 && (
                        <p className="text-gray-400 text-xs mt-0.5 truncate max-w-md">
                          {items.slice(0, 3).join(' · ')}{items.length > 3 ? ` +${items.length - 3} more` : ''}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-black text-brand-dark ml-4 flex-shrink-0">${fmt(total)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <BarFill pct={pct} className="h-full bg-brand-red rounded-full transition-all duration-500" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Low stock */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-brand-dark flex items-center gap-2">
              <AlertTriangle size={15} className={lowStockTires.length > 0 ? 'text-brand-red' : 'text-gray-300'} />
              Low Stock
            </h2>
            <Link href="/admin/inventory" className="text-xs text-brand-red font-semibold hover:underline">Manage →</Link>
          </div>
          {lowStockTires.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-gray-400 flex flex-col items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-400" />
              All tires well stocked
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {lowStockTires.map((t, i) => (
                <div key={i} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-brand-dark">{t.brand} {t.model}</p>
                    <p className="text-gray-400 text-xs font-mono">{t.width}/{t.aspect}R{t.diameter}{t.location ? ` · ${t.location}` : ''}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${t.quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {t.quantity === 0 ? 'OUT' : `${t.quantity} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent messages */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-brand-dark flex items-center gap-2">
              <MessageSquare size={15} className="text-gray-400" />
              Recent Messages
            </h2>
            {unreadMessages > 0 && (
              <span className="bg-brand-red text-white text-xs font-bold px-2.5 py-0.5 rounded-full">{unreadMessages} new</span>
            )}
          </div>
          {recentMessages.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-gray-400">No messages yet.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentMessages.map((msg) => (
                <div key={msg.id} className="px-6 py-3 flex items-start gap-3">
                  <div className="w-8 h-8 bg-brand-red/10 rounded-full flex items-center justify-center text-brand-red font-bold text-xs flex-shrink-0">
                    {msg.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-sm text-brand-dark truncate">{msg.name}</p>
                      {!msg.read && <span className="w-1.5 h-1.5 bg-brand-red rounded-full flex-shrink-0" />}
                      <span className="text-gray-400 text-xs ml-auto flex-shrink-0">
                        {new Date(msg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs truncate">{msg.message}</p>
                    {msg.phone && <p className="text-gray-400 text-xs">{msg.phone}</p>}
                  </div>
                  <a
                    href={`mailto:${msg.email}`}
                    className="flex-shrink-0 text-xs text-brand-red border border-brand-red/30 px-2.5 py-1 rounded-lg hover:bg-brand-red hover:text-white transition-all"
                  >
                    Reply
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
