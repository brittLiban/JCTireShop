'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X, Pencil, Trash2, Truck } from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'RECEIVED' | 'CANCELLED'

interface SupplierOrder {
  id: string
  supplier: string
  orderNumber?: string | null
  items: { name: string; qty: number; unitCost: number }[]
  totalCost: string
  status: OrderStatus
  orderedAt: string
  expectedAt?: string | null
  notes?: string | null
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 border border-blue-200',
  SHIPPED: 'bg-purple-50 text-purple-700 border border-purple-200',
  RECEIVED: 'bg-green-50 text-green-700 border border-green-200',
  CANCELLED: 'bg-gray-50 text-gray-500 border border-gray-200',
}

const STATUS_OPTIONS: OrderStatus[] = ['PENDING', 'CONFIRMED', 'SHIPPED', 'RECEIVED', 'CANCELLED']

const schema = z.object({
  supplier: z.string().min(1, 'Required').max(100),
  orderNumber: z.string().max(100).optional(),
  itemsDescription: z.string().min(1, 'Required'),
  totalCost: z.coerce.number({ invalid_type_error: 'Required' }).positive('Must be positive'),
  status: z.enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'RECEIVED', 'CANCELLED']),
  expectedAt: z.string().optional(),
  notes: z.string().max(1000).optional(),
})

type FormData = z.infer<typeof schema>

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-red-500 text-xs mt-1">{msg}</p>
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<SupplierOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SupplierOrder | null>(null)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'PENDING' },
  })

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/orders')
      if (!res.ok) throw new Error()
      setOrders(await res.json())
    } catch {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const openAdd = () => {
    setEditing(null)
    reset({ status: 'PENDING' })
    setModalOpen(true)
  }

  const openEdit = (o: SupplierOrder) => {
    setEditing(o)
    const itemsDesc = o.items
      .map((i) => `${i.qty}x ${i.name}`)
      .join(', ')
    reset({
      supplier: o.supplier,
      orderNumber: o.orderNumber ?? '',
      itemsDescription: itemsDesc || '',
      totalCost: parseFloat(o.totalCost),
      status: o.status,
      expectedAt: o.expectedAt ? o.expectedAt.slice(0, 10) : '',
      notes: o.notes ?? '',
    })
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    const payload = {
      supplier: data.supplier,
      orderNumber: data.orderNumber || undefined,
      items: [{ name: data.itemsDescription, qty: 1, unitCost: data.totalCost }],
      totalCost: data.totalCost,
      status: data.status,
      expectedAt: data.expectedAt || null,
      notes: data.notes || undefined,
    }
    try {
      const url = editing ? `/api/admin/orders/${editing.id}` : '/api/admin/orders'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      toast.success(editing ? 'Order updated!' : 'Order created!')
      setModalOpen(false)
      fetchOrders()
    } catch {
      toast.error('Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const deleteOrder = async (id: string, supplier: string) => {
    if (!confirm(`Delete order from "${supplier}"?`)) return
    try {
      const res = await fetch(`/api/admin/orders/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setOrders((prev) => prev.filter((o) => o.id !== id))
      toast.success('Order deleted.')
    } catch {
      toast.error('Failed to delete.')
    }
  }

  const activeCount = orders.filter(
    (o) => o.status === 'PENDING' || o.status === 'CONFIRMED' || o.status === 'SHIPPED'
  ).length

  return (
    <div>
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-dark">Supplier Orders</h1>
          <p className="text-gray-500 text-sm mt-1">
            {orders.length} order{orders.length !== 1 ? 's' : ''} total
            {activeCount > 0 && (
              <span className="ml-2 text-orange-500 font-medium">
                · {activeCount} active
              </span>
            )}
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary flex-shrink-0">
          <Plus size={16} /> New Order
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Supplier', 'Order #', 'Total', 'Status', 'Ordered', 'Expected', 'Notes', ''].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <span className="w-4 h-4 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
                      Loading orders...
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <Truck size={32} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">
                      No orders yet. Create one to get started.
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 font-semibold text-brand-dark">{o.supplier}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {o.orderNumber || '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-brand-dark">
                      ${parseFloat(o.totalCost).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('px-2.5 py-1 rounded-lg text-xs font-semibold', STATUS_COLORS[o.status])}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(o.orderedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {o.expectedAt
                        ? new Date(o.expectedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 max-w-[120px]">
                      <span className="truncate block">{o.notes || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(o)}
                          className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                          aria-label="Edit order"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => deleteOrder(o.id, o.supplier)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-brand-red transition-colors"
                          aria-label="Delete order"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false) }}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-lg text-brand-dark">
                {editing ? 'Edit Order' : 'New Supplier Order'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="admin-label">Supplier *</label>
                  <input {...register('supplier')} className="admin-input" placeholder="Tire Rack" />
                  <FieldError msg={errors.supplier?.message} />
                </div>
                <div>
                  <label className="admin-label">Order # <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input {...register('orderNumber')} className="admin-input" placeholder="PO-12345" />
                </div>
              </div>

              <div>
                <label className="admin-label">Items Description *</label>
                <textarea
                  {...register('itemsDescription')}
                  rows={3}
                  className="admin-input resize-none"
                  placeholder="e.g. 4x Michelin Defender2 225/65R17, 2x Goodyear Assurance 205/55R16"
                />
                <FieldError msg={errors.itemsDescription?.message} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="admin-label">Total Cost ($) *</label>
                  <input
                    {...register('totalCost')}
                    type="number"
                    step="0.01"
                    className="admin-input"
                    placeholder="450.00"
                  />
                  <FieldError msg={errors.totalCost?.message} />
                </div>
                <div>
                  <label className="admin-label">Status *</label>
                  <select {...register('status')} className="admin-select">
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="admin-label">Expected Delivery <span className="text-gray-400 font-normal">(optional)</span></label>
                <input {...register('expectedAt')} type="date" className="admin-input" />
              </div>

              <div>
                <label className="admin-label">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                <input {...register('notes')} className="admin-input" placeholder="Any notes about this order..." />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-brand-red text-white rounded-xl py-2.5 text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editing ? 'Update Order' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
