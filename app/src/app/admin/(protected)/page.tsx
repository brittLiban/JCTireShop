export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { Package, Truck, MessageSquare, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboard() {
  const [totalTires, totalOrders, unreadMessages, lowStockCount, recentMessages, pendingOrders] =
    await Promise.all([
      prisma.tire.count(),
      prisma.supplierOrder.count(),
      prisma.contactSubmission.count({ where: { read: false } }),
      prisma.tire.count({ where: { quantity: { lte: 4 } } }),
      prisma.contactSubmission.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supplierOrder.count({
        where: { status: { in: ['PENDING', 'CONFIRMED', 'SHIPPED'] } },
      }),
    ])

  const stats = [
    {
      label: 'Total Tire SKUs',
      value: totalTires,
      icon: Package,
      href: '/admin/inventory',
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Supplier Orders',
      value: totalOrders,
      icon: Truck,
      href: '/admin/orders',
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Unread Messages',
      value: unreadMessages,
      icon: MessageSquare,
      href: '#messages',
      color: unreadMessages > 0 ? 'text-orange-600 bg-orange-50' : 'text-gray-400 bg-gray-50',
    },
    {
      label: 'Low Stock Alerts',
      value: lowStockCount,
      icon: AlertTriangle,
      href: '/admin/inventory',
      color: lowStockCount > 0 ? 'text-red-600 bg-red-50' : 'text-gray-400 bg-gray-50',
    },
  ]

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-2xl font-black text-brand-dark">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Overview of JC Tire Shop operations.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon, href, color }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${color}`}>
              <Icon size={20} />
            </div>
            <p className="text-3xl font-black text-brand-dark">{value}</p>
            <p className="text-gray-500 text-xs mt-1 group-hover:text-brand-dark transition-colors">
              {label}
            </p>
          </Link>
        ))}
      </div>

      {/* Active orders banner */}
      {pendingOrders > 0 && (
        <div className="bg-brand-red/5 border border-brand-red/20 rounded-2xl px-6 py-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck size={18} className="text-brand-red" />
            <p className="text-brand-dark text-sm font-medium">
              {pendingOrders} supplier order{pendingOrders > 1 ? 's' : ''} in progress
            </p>
          </div>
          <Link href="/admin/orders" className="text-brand-red text-sm font-semibold hover:underline">
            View →
          </Link>
        </div>
      )}

      {/* Recent messages */}
      <div id="messages" className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-bold text-brand-dark">Recent Contact Messages</h2>
          {unreadMessages > 0 && (
            <span className="bg-brand-red text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
              {unreadMessages} new
            </span>
          )}
        </div>

        {recentMessages.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            No messages yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentMessages.map((msg) => (
              <div key={msg.id} className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50/50 transition-colors">
                <div className="w-9 h-9 bg-brand-red/8 rounded-full flex items-center justify-center text-brand-red font-bold text-sm flex-shrink-0">
                  {msg.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-brand-dark">{msg.name}</p>
                    {!msg.read && (
                      <span className="w-2 h-2 bg-brand-red rounded-full flex-shrink-0" />
                    )}
                    <span className="text-gray-400 text-xs ml-auto flex-shrink-0">
                      {new Date(msg.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs">{msg.email}</p>
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">{msg.message}</p>
                </div>
                <a
                  href={`mailto:${msg.email}`}
                  className="flex-shrink-0 px-3 py-1.5 text-xs text-brand-red border border-brand-red/30 rounded-lg hover:bg-brand-red hover:text-white transition-all"
                >
                  Reply
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
