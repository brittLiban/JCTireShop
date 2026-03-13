'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X, Pencil, Trash2, AlertTriangle, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

interface Tire {
  id: string
  brand: string
  model: string
  width: number
  aspect: number
  diameter: number
  quantity: number
  cost: string
  price: string
  notes?: string | null
}

const schema = z.object({
  brand: z.string().min(1, 'Required').max(100),
  model: z.string().min(1, 'Required').max(100),
  width: z.coerce.number({ invalid_type_error: 'Required' }).int().positive('Must be positive'),
  aspect: z.coerce.number({ invalid_type_error: 'Required' }).int().positive('Must be positive'),
  diameter: z.coerce.number({ invalid_type_error: 'Required' }).int().positive('Must be positive'),
  quantity: z.coerce.number({ invalid_type_error: 'Required' }).int().min(0, 'Min 0'),
  cost: z.coerce.number({ invalid_type_error: 'Required' }).positive('Must be positive'),
  price: z.coerce.number({ invalid_type_error: 'Required' }).positive('Must be positive'),
  notes: z.string().max(500).optional(),
})

type FormData = z.infer<typeof schema>

function QuantityBadge({ qty }: { qty: number }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold',
        qty === 0
          ? 'bg-red-100 text-red-700'
          : qty <= 4
          ? 'bg-red-50 text-red-600'
          : qty <= 10
          ? 'bg-yellow-50 text-yellow-700'
          : 'bg-green-50 text-green-700'
      )}
    >
      {qty <= 4 && <AlertTriangle size={9} />}
      {qty}
    </span>
  )
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-red-500 text-xs mt-1">{msg}</p>
}

export default function InventoryPage() {
  const [tires, setTires] = useState<Tire[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Tire | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const fetchTires = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/tires')
      if (!res.ok) throw new Error()
      setTires(await res.json())
    } catch {
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTires() }, [fetchTires])

  const openAdd = () => {
    setEditing(null)
    reset({ quantity: 0 })
    setModalOpen(true)
  }

  const openEdit = (t: Tire) => {
    setEditing(t)
    reset({
      brand: t.brand,
      model: t.model,
      width: t.width,
      aspect: t.aspect,
      diameter: t.diameter,
      quantity: t.quantity,
      cost: parseFloat(t.cost),
      price: parseFloat(t.price),
      notes: t.notes ?? '',
    })
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const url = editing ? `/api/admin/tires/${editing.id}` : '/api/admin/tires'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      toast.success(editing ? 'Tire updated!' : 'Tire added!')
      setModalOpen(false)
      fetchTires()
    } catch {
      toast.error('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const deleteTire = async (id: string, label: string) => {
    if (!confirm(`Delete "${label}" from inventory?`)) return
    try {
      const res = await fetch(`/api/admin/tires/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setTires((prev) => prev.filter((t) => t.id !== id))
      toast.success('Tire removed.')
    } catch {
      toast.error('Failed to delete.')
    }
  }

  const filtered = tires.filter((t) =>
    search === '' ||
    `${t.brand} ${t.model}`.toLowerCase().includes(search.toLowerCase())
  )

  const lowStockCount = tires.filter((t) => t.quantity <= 4).length

  return (
    <div>
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-dark">Inventory</h1>
          <p className="text-gray-500 text-sm mt-1">
            {tires.length} SKU{tires.length !== 1 ? 's' : ''} tracked
            {lowStockCount > 0 && (
              <span className="ml-2 text-red-500 font-medium">
                · {lowStockCount} low stock
              </span>
            )}
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary flex-shrink-0">
          <Plus size={16} /> Add Tire
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by brand or model..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-input max-w-xs"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Brand', 'Model', 'Size', 'Qty', 'Cost', 'Price', 'Notes', ''].map((h) => (
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
                      Loading inventory...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <Package size={32} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">
                      {search ? 'No tires match your search.' : 'No tires in inventory. Add one to get started.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 font-semibold text-brand-dark">{t.brand}</td>
                    <td className="px-4 py-3 text-gray-600">{t.model}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">
                      {t.width}/{t.aspect}R{t.diameter}
                    </td>
                    <td className="px-4 py-3">
                      <QuantityBadge qty={t.quantity} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      ${parseFloat(t.cost).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-brand-dark">
                      ${parseFloat(t.price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-400 max-w-[140px]">
                      <span className="truncate block">{t.notes || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(t)}
                          className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                          aria-label="Edit tire"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => deleteTire(t.id, `${t.brand} ${t.model}`)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-brand-red transition-colors"
                          aria-label="Delete tire"
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
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-lg text-brand-dark">
                {editing ? 'Edit Tire' : 'Add New Tire'}
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
                  <label className="admin-label">Brand *</label>
                  <input {...register('brand')} className="admin-input" placeholder="Michelin" />
                  <FieldError msg={errors.brand?.message} />
                </div>
                <div>
                  <label className="admin-label">Model *</label>
                  <input {...register('model')} className="admin-input" placeholder="Defender2" />
                  <FieldError msg={errors.model?.message} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="admin-label">Width (mm) *</label>
                  <input {...register('width')} type="number" className="admin-input" placeholder="225" />
                  <FieldError msg={errors.width?.message} />
                </div>
                <div>
                  <label className="admin-label">Aspect (%) *</label>
                  <input {...register('aspect')} type="number" className="admin-input" placeholder="65" />
                  <FieldError msg={errors.aspect?.message} />
                </div>
                <div>
                  <label className="admin-label">Diameter (in) *</label>
                  <input {...register('diameter')} type="number" className="admin-input" placeholder="17" />
                  <FieldError msg={errors.diameter?.message} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="admin-label">Qty *</label>
                  <input {...register('quantity')} type="number" min="0" className="admin-input" placeholder="0" />
                  <FieldError msg={errors.quantity?.message} />
                </div>
                <div>
                  <label className="admin-label">Cost ($) *</label>
                  <input {...register('cost')} type="number" step="0.01" className="admin-input" placeholder="85.00" />
                  <FieldError msg={errors.cost?.message} />
                </div>
                <div>
                  <label className="admin-label">Price ($) *</label>
                  <input {...register('price')} type="number" step="0.01" className="admin-input" placeholder="129.00" />
                  <FieldError msg={errors.price?.message} />
                </div>
              </div>

              <div>
                <label className="admin-label">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                <input {...register('notes')} className="admin-input" placeholder="e.g. All-season, winter, run-flat..." />
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
                  {saving ? 'Saving...' : editing ? 'Update Tire' : 'Add Tire'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
