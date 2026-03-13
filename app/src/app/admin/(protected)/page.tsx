export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { BarFill } from '@/components/BarFill'
import {
  Package,
  Truck,
  MessageSquare,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
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

export default async function AdminDashboard() {
  const [
    totalTires,
    totalOrders,
    unreadMessages,
    lowStockTires,
    recentMessages,
    allOrders,
    tireInventory,
  ] = await Promise.all([
    prisma.tire.count(),
    prisma.supplierOrder.count(),
    prisma.contactSubmission.count({ where: { read: false } }),
    prisma.tire.findMany({
      where: { quantity: { lte: 4 } },
      select: { brand: true, model: true, width: true, aspect: true, diameter: true, quantity: true },
    }),
    prisma.contactSubmission.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
    prisma.supplierOrder.findMany({
      orderBy: { orderedAt: 'desc' },
      select: { id: true, supplier: true, totalCost: true, status: true, orderedAt: true, orderNumber: true },
    }),
    prisma.tire.findMany({
      select: { quantity: true, cost: true, price: true },
    }),
  ])

  // ── Spend analytics ──────────────────────────────────────────────────────────
  const totalSpent = allOrders.reduce((s, o) => s + Number(o.totalCost), 0)
  const outstanding = allOrders
    .filter((o) => ['PENDING', 'CONFIRMED', 'SHIPPED'].includes(o.status))
    .reduce((s, o) => s + Number(o.totalCost), 0)
  const avgOrder = totalOrders > 0 ? totalSpent / totalOrders : 0

  // Spend per supplier (sorted desc)
  const supplierMap: Record<string, number> = {}
  for (const o of allOrders) {
    supplierMap[o.supplier] = (supplierMap[o.supplier] ?? 0) + Number(o.totalCost)
  }
  const supplierSpend = Object.entries(supplierMap)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)
  const maxSupplierSpend = supplierSpend[0]?.total ?? 1

  // Orders by status
  const statusMap: Record<string, number> = {}
  for (const o of allOrders) {
    statusMap[o.status] = (statusMap[o.status] ?? 0) + 1
  }

  // Inventory value
  const inventoryCostValue = tireInventory.reduce(
    (s, t) => s + Number(t.cost) * t.quantity, 0
  )
  const inventoryRetailValue = tireInventory.reduce(
    (s, t) => s + Number(t.price) * t.quantity, 0
  )
  const totalUnits = tireInventory.reduce((s, t) => s + t.quantity, 0)

  const pendingOrders = allOrders.filter((o) =>
    ['PENDING', 'CONFIRMED', 'SHIPPED'].includes(o.status)
  ).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-brand-dark">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">JC Tire Shop — business overview</p>
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
          <Link href="/admin/orders" className="text-brand-red text-sm font-semibold hover:underline">
            View →
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Spent',
            value: `$${fmt(totalSpent)}`,
            sub: 'all supplier orders',
            icon: DollarSign,
            color: 'text-emerald-600 bg-emerald-50',
            href: '/admin/orders',
          },
          {
            label: 'Outstanding',
            value: `$${fmt(outstanding)}`,
            sub: 'pending / in transit',
            icon: TrendingUp,
            color: outstanding > 0 ? 'text-orange-600 bg-orange-50' : 'text-gray-400 bg-gray-50',
            href: '/admin/orders',
          },
          {
            label: 'Avg Order',
            value: `$${fmt(avgOrder)}`,
            sub: `across ${totalOrders} orders`,
            icon: Truck,
            color: 'text-blue-600 bg-blue-50',
            href: '/admin/orders',
          },
          {
            label: 'Inventory Value',
            value: `$${fmt(inventoryCostValue)}`,
            sub: `cost · ${totalUnits} units`,
            icon: Package,
            color: 'text-purple-600 bg-purple-50',
            href: '/admin/inventory',
          },
        ].map(({ label, value, sub, icon: Icon, color, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all group"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-black text-brand-dark leading-tight">{value}</p>
            <p className="text-gray-400 text-xs mt-1">{label}</p>
            <p className="text-gray-400 text-xs">{sub}</p>
          </Link>
        ))}
      </div>

      {/* Middle row: Spend by Supplier + Order Status */}
      <div className="grid lg:grid-cols-5 gap-6">

        {/* Spend by Supplier — bar chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-brand-dark mb-1">Spend by Supplier</h2>
          <p className="text-gray-400 text-xs mb-6">Total cost of all orders per vendor</p>

          {supplierSpend.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">No orders yet.</p>
          ) : (
            <div className="space-y-4">
              {supplierSpend.map(({ name, total }) => {
                const pct = Math.max(4, Math.round((total / maxSupplierSpend) * 100))
                return (
                  <div key={name}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-medium text-brand-dark truncate max-w-[180px]">{name}</span>
                      <span className="text-sm font-bold text-brand-dark ml-2 flex-shrink-0">${fmt(total)}</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <BarFill pct={pct} className="h-full bg-brand-red rounded-full transition-all duration-500" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Order Status Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-brand-dark mb-1">Order Status</h2>
          <p className="text-gray-400 text-xs mb-6">Breakdown of all {totalOrders} orders</p>

          {totalOrders === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {(['PENDING', 'CONFIRMED', 'SHIPPED', 'RECEIVED', 'CANCELLED'] as const).map((s) => {
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
                    <span className="text-sm font-bold text-brand-dark w-6 text-right flex-shrink-0">{count}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Retail vs cost summary */}
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
              <span className="text-gray-500 font-medium">Gross margin potential</span>
              <span className="font-bold text-emerald-600">
                ${fmt(inventoryRetailValue - inventoryCostValue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: Low stock + Recent messages */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Low stock */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-brand-dark flex items-center gap-2">
              <AlertTriangle size={15} className={lowStockTires.length > 0 ? 'text-brand-red' : 'text-gray-300'} />
              Low Stock
            </h2>
            <Link href="/admin/inventory" className="text-xs text-brand-red font-semibold hover:underline">
              Manage →
            </Link>
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
                    <p className="text-gray-400 text-xs font-mono">
                      {t.width}/{t.aspect}R{t.diameter}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    t.quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {t.quantity === 0 ? 'OUT' : `${t.quantity} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent messages */}
        <div id="messages" className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-brand-dark flex items-center gap-2">
              <MessageSquare size={15} className="text-gray-400" />
              Recent Messages
            </h2>
            {unreadMessages > 0 && (
              <span className="bg-brand-red text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                {unreadMessages} new
              </span>
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
