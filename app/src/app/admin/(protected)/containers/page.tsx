'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, X, Box } from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

interface Container {
  id: string
  name: string
  notes?: string | null
  capacity?: number | null
  createdAt: string
  _count: { tires: number }
}

const schema = z.object({
  name:     z.string().min(1, 'Name is required').max(100),
  notes:    z.string().max(500).optional(),
  capacity: z.coerce.number().int().positive().optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

export default function ContainersPage() {
  const [containers, setContainers] = useState<Container[]>([])
  const [loading,    setLoading]    = useState(true)
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editing,    setEditing]    = useState<Container | null>(null)
  const [saving,     setSaving]     = useState(false)
  const [deleting,   setDeleting]   = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const fetchContainers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/containers')
      if (!res.ok) throw new Error()
      setContainers(await res.json())
    } catch {
      toast.error('Failed to load containers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchContainers() }, [fetchContainers])

  const openAdd = () => {
    setEditing(null)
    reset({ name: '', notes: '', capacity: '' })
    setModalOpen(true)
  }

  const openEdit = (c: Container) => {
    setEditing(c)
    reset({
      name:     c.name,
      notes:    c.notes ?? '',
      capacity: c.capacity ?? '',
    })
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const payload = {
        name:     data.name,
        notes:    data.notes || null,
        capacity: data.capacity === '' || data.capacity === undefined ? null : Number(data.capacity),
      }
      const url    = editing ? `/api/admin/containers/${editing.id}` : '/api/admin/containers'
      const method = editing ? 'PUT' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Save failed')
      }
      toast.success(editing ? 'Container updated!' : 'Container created!')
      setModalOpen(false)
      fetchContainers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const deleteContainer = async (c: Container) => {
    if (c._count.tires > 0) {
      toast.error(`Reassign the ${c._count.tires} tire(s) in "${c.name}" before deleting`)
      return
    }
    if (!confirm(`Delete container "${c.name}"?`)) return
    setDeleting(c.id)
    try {
      const res = await fetch(`/api/admin/containers/${c.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Delete failed')
      }
      setContainers((prev) => prev.filter((x) => x.id !== c.id))
      toast.success('Container deleted.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setDeleting(null)
    }
  }

  const totalTires = containers.reduce((s, c) => s + c._count.tires, 0)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-dark">Containers</h1>
          <p className="text-gray-500 text-sm mt-1">
            {containers.length} container{containers.length !== 1 ? 's' : ''} · {totalTires} tires assigned
          </p>
        </div>
        <button type="button" onClick={openAdd} className="btn-primary flex-shrink-0 text-sm">
          <Plus size={15} /> New Container
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <p className="font-semibold">What are containers?</p>
        <p className="mt-1 text-blue-600 text-xs leading-relaxed">
          Containers are physical storage locations — shelves, bins, racks, storage rooms. Assign tires
          to a container from the Inventory page. The existing free-text &ldquo;location&rdquo; field on each tire
          still works independently.
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading containers...</div>
      ) : containers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Box size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 font-medium">No containers yet</p>
          <p className="text-gray-300 text-sm mt-1">Create containers to organize where tires are stored</p>
          <button type="button" onClick={openAdd} className="mt-4 btn-primary text-sm px-4 py-2">
            <Plus size={14} /> Create First Container
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {containers.map((c) => {
            const pct = c.capacity ? Math.min(100, Math.round((c._count.tires / c.capacity) * 100)) : null

            return (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 bg-brand-dark rounded-xl flex items-center justify-center flex-shrink-0">
                      <Box size={16} className="text-brand-yellow" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-brand-dark text-sm leading-tight truncate">{c.name}</p>
                      {c.notes && (
                        <p className="text-gray-400 text-xs mt-0.5 leading-tight line-clamp-1">{c.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                      aria-label="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteContainer(c)}
                      disabled={deleting === c.id}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-brand-red transition-colors disabled:opacity-40"
                      aria-label="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-2xl font-black text-brand-dark">{c._count.tires}</p>
                    <p className="text-xs text-gray-400">
                      tire SKU{c._count.tires !== 1 ? 's' : ''} assigned
                      {c.capacity && ` of ${c.capacity} capacity`}
                    </p>
                  </div>
                  {pct !== null && (
                    <div className="text-right">
                      <p className={clsx(
                        'text-lg font-bold',
                        pct >= 90 ? 'text-red-500' : pct >= 70 ? 'text-yellow-600' : 'text-emerald-600'
                      )}>
                        {pct}%
                      </p>
                      <p className="text-[10px] text-gray-400">full</p>
                    </div>
                  )}
                </div>

                {/* Capacity bar */}
                {pct !== null && (
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={clsx(
                        'h-full rounded-full transition-all',
                        pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-400' : 'bg-emerald-500'
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false) }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-lg text-brand-dark">
                {editing ? 'Edit Container' : 'New Container'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="admin-label">Container Name *</label>
                <input
                  {...register('name')}
                  className="admin-input"
                  placeholder="e.g. Shelf A, Bin 3, Back Storage"
                  autoFocus
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="admin-label">Notes</label>
                <input
                  {...register('notes')}
                  className="admin-input"
                  placeholder="Description or location details..."
                />
              </div>

              <div>
                <label className="admin-label">Capacity (optional)</label>
                <input
                  {...register('capacity')}
                  type="number"
                  min={1}
                  className="admin-input"
                  placeholder="Max number of tire SKUs"
                />
                <p className="text-gray-400 text-[10px] mt-1">Leave blank for unlimited</p>
                {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity.message}</p>}
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
                  className="flex-1 bg-brand-dark text-white rounded-xl py-2.5 text-sm font-bold hover:bg-black transition-colors disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
