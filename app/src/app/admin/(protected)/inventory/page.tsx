'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus, X, Pencil, Trash2, AlertTriangle,
  DollarSign, TrendingUp, BarChart2, Package,
  Search, CheckCircle2, XCircle, Minus, Tag,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

interface Tire {
  id: string
  sku?: string | null
  brand: string
  model: string
  width: number
  aspect: number
  diameter: number
  quantity: number
  cost: string
  price: string
  notes?: string | null
  allocSets?: number | null
  allocPairs?: number | null
  allocSingles?: number | null
}

const schema = z.object({
  sku:          z.string().max(100).optional(),
  brand:        z.string().min(1, 'Required').max(100),
  model:        z.string().min(1, 'Required').max(100),
  width:        z.coerce.number({ invalid_type_error: 'Required' }).int().positive(),
  aspect:       z.coerce.number({ invalid_type_error: 'Required' }).int().positive(),
  diameter:     z.coerce.number({ invalid_type_error: 'Required' }).int().positive(),
  quantity:     z.coerce.number().int().min(0).optional(),
  cost:         z.coerce.number({ invalid_type_error: 'Required' }).positive(),
  price:        z.coerce.number({ invalid_type_error: 'Required' }).positive(),
  notes:        z.string().max(500).optional(),
  allocSets:    z.coerce.number().int().min(0).optional(),
  allocPairs:   z.coerce.number().int().min(0).optional(),
  allocSingles: z.coerce.number().int().min(0).optional(),
})

type FormData = z.infer<typeof schema>
type StockFilter = 'all' | 'in-stock' | 'low' | 'out' | 'single' | 'pair' | 'set'

function parseSizeQuery(q: string): { width?: number; aspect?: number; diameter?: number } {
  // compact: "22565R17" or "2256517"
  const compact = q.trim().match(/^(\d{3})(\d{2})[rR]?(\d{2})$/)
  if (compact) return { width: Number(compact[1]), aspect: Number(compact[2]), diameter: Number(compact[3]) }
  const clean = q.replace(/[-rR]/g, ' ').replace(/[/,]/g, ' ').trim()
  const parts = clean.split(/\s+/).map(Number).filter((n) => !isNaN(n) && n > 0)
  if (parts.length === 3) return { width: parts[0], aspect: parts[1], diameter: parts[2] }
  return {}
}

function stockStatus(qty: number) {
  if (qty === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700',       icon: XCircle }
  if (qty <= 4)  return { label: 'Low Stock',    color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle }
  return               { label: 'In Stock',      color: 'bg-green-100 text-green-700',   icon: CheckCircle2 }
}

function stockBreakdown(qty: number) {
  if (qty === 0) return null
  return { sets: Math.floor(qty / 4), pairs: Math.floor(qty / 2), singles: qty }
}

export default function InventoryPage() {
  const [tires,     setTires]     = useState<Tire[]>([])
  const [loading,   setLoading]   = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<Tire | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState<StockFilter>('all')
  const [adjusting, setAdjusting] = useState<string | null>(null)
  const [usedMode,  setUsedMode]  = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const watchedQty          = watch('quantity')
  const watchedAllocSets    = watch('allocSets')
  const watchedAllocPairs   = watch('allocPairs')
  const watchedAllocSingles = watch('allocSingles')
  const allocTotal = (Number(watchedAllocSets) || 0) * 4 + (Number(watchedAllocPairs) || 0) * 2 + (Number(watchedAllocSingles) || 0)

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

  const filtered = tires.filter((t) => {
    if (filter === 'in-stock' && t.quantity <= 4)                    return false
    if (filter === 'low'      && !(t.quantity > 0 && t.quantity <= 4)) return false
    if (filter === 'out'      && t.quantity !== 0)                   return false
    if (filter === 'single'   && t.quantity !== 1)                   return false
    if (filter === 'pair'     && t.quantity < 2)                     return false
    if (filter === 'set'      && t.quantity < 4)                     return false
    if (search === '') return true
    const size = parseSizeQuery(search)
    if (size.width || size.diameter) {
      return (
        (!size.width    || t.width    === size.width)  &&
        (!size.aspect   || t.aspect   === size.aspect) &&
        (!size.diameter || t.diameter === size.diameter)
      )
    }
    const q = search.toLowerCase()
    const sizeStr = `${t.width}/${t.aspect}r${t.diameter}`
    return (
      (t.sku ?? '').toLowerCase().includes(q) ||
      t.brand.toLowerCase().includes(q)       ||
      t.model.toLowerCase().includes(q)       ||
      sizeStr.includes(q.replace(/[rR]/g, 'r'))
    )
  })

  const sizeSearched = search ? parseSizeQuery(search) : {}
  const isSizeSearch = Boolean(sizeSearched.width || sizeSearched.diameter)
  const sizeSummary  = isSizeSearch && filtered.length > 0
    ? filtered.reduce((acc, t) => {
        if (t.brand.toLowerCase() === 'used') {
          acc.sets    += t.allocSets    ?? 0
          acc.pairs   += t.allocPairs   ?? 0
          acc.singles += t.allocSingles ?? 0
        } else {
          acc.sets    += Math.floor(t.quantity / 4)
          acc.pairs   += Math.floor(t.quantity / 2)
          acc.singles += t.quantity
        }
        acc.total += t.quantity
        return acc
      }, { sets: 0, pairs: 0, singles: 0, total: 0 })
    : null

  const adjustQty = async (t: Tire, delta: number) => {
    const newQty = Math.max(0, t.quantity + delta)
    setAdjusting(t.id)
    try {
      const res = await fetch(`/api/admin/tires/${t.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty }),
      })
      if (!res.ok) throw new Error()
      setTires((prev) => prev.map((x) => x.id === t.id ? { ...x, quantity: newQty } : x))
    } catch { toast.error('Failed to update quantity') }
    finally  { setAdjusting(null) }
  }

  const adjustAlloc = async (t: Tire, field: 'allocSets' | 'allocPairs' | 'allocSingles', delta: number) => {
    const newVal  = Math.max(0, (t[field] ?? 0) + delta)
    const updated = {
      allocSets:    field === 'allocSets'    ? newVal : (t.allocSets    ?? 0),
      allocPairs:   field === 'allocPairs'   ? newVal : (t.allocPairs   ?? 0),
      allocSingles: field === 'allocSingles' ? newVal : (t.allocSingles ?? 0),
    }
    const newQty = updated.allocSets * 4 + updated.allocPairs * 2 + updated.allocSingles
    setAdjusting(t.id)
    try {
      const res = await fetch(`/api/admin/tires/${t.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updated, quantity: newQty }),
      })
      if (!res.ok) throw new Error()
      setTires((prev) => prev.map((x) => x.id === t.id ? { ...x, ...updated, quantity: newQty } : x))
    } catch { toast.error('Failed to update') }
    finally  { setAdjusting(null) }
  }

  const openAdd = () => {
    setEditing(null)
    setUsedMode(false)
    reset({ sku: '', brand: '', model: '', quantity: 0, allocSets: 0, allocPairs: 0, allocSingles: 0, notes: '' })
    setModalOpen(true)
  }

  const openEdit = (t: Tire) => {
    setEditing(t)
    const isUsed = t.brand.toLowerCase() === 'used'
    setUsedMode(isUsed)
    reset({
      sku: t.sku ?? '', brand: t.brand, model: t.model,
      width: t.width, aspect: t.aspect, diameter: t.diameter,
      quantity: t.quantity, cost: parseFloat(t.cost), price: parseFloat(t.price),
      notes: t.notes ?? '',
      allocSets: t.allocSets ?? 0, allocPairs: t.allocPairs ?? 0, allocSingles: t.allocSingles ?? 0,
    })
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const url    = editing ? `/api/admin/tires/${editing.id}` : '/api/admin/tires'
      const method = editing ? 'PUT' : 'POST'
      let payload: Record<string, unknown>

      if (usedMode) {
        const allocSets    = Number(data.allocSets)    || 0
        const allocPairs   = Number(data.allocPairs)   || 0
        const allocSingles = Number(data.allocSingles) || 0
        payload = {
          brand: 'Used', model: `${data.width}/${data.aspect}R${data.diameter}`,
          width: data.width, aspect: data.aspect, diameter: data.diameter,
          cost: data.cost, price: data.price, notes: data.notes?.trim() || null,
          sku: null, quantity: allocSets * 4 + allocPairs * 2 + allocSingles,
          allocSets, allocPairs, allocSingles,
        }
      } else {
        payload = {
          ...data, sku: data.sku?.trim() || null, notes: data.notes?.trim() || null,
          allocSets: null, allocPairs: null, allocSingles: null,
        }
      }

      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        let message = 'Failed to save. Please try again.'
        try { const b = await res.json(); if (typeof b.error === 'string') message = b.error } catch {}
        throw new Error(message)
      }
      toast.success(editing ? 'Tire updated!' : 'Tire added!')
      setModalOpen(false)
      fetchTires()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    } finally { setSaving(false) }
  }

  const deleteTire = async (id: string, label: string) => {
    if (!confirm(`Delete "${label}" from inventory?`)) return
    try {
      const res = await fetch(`/api/admin/tires/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setTires((prev) => prev.filter((t) => t.id !== id))
      toast.success('Tire removed.')
    } catch { toast.error('Failed to delete.') }
  }

  const fmt             = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const totalUnits      = tires.reduce((s, t) => s + t.quantity, 0)
  const costVal         = tires.reduce((s, t) => s + parseFloat(t.cost)  * t.quantity, 0)
  const retailVal       = tires.reduce((s, t) => s + parseFloat(t.price) * t.quantity, 0)
  const margin          = retailVal - costVal
  const marginPct       = retailVal > 0 ? (margin / retailVal) * 100 : 0
  const lowCount        = tires.filter((t) => t.quantity > 0 && t.quantity <= 4).length
  const outCount        = tires.filter((t) => t.quantity === 0).length
  const missingSkuCount = tires.filter((t) => !t.sku?.trim() && t.brand.toLowerCase() !== 'used').length
  const singleCount     = tires.filter((t) => t.quantity === 1).length
  const pairCount       = tires.filter((t) => t.quantity >= 2).length
  const setCount        = tires.filter((t) => t.quantity >= 4).length

  const AllocRow = ({ field, label, color, val, tireId }: {
    field: 'allocSets' | 'allocPairs' | 'allocSingles'
    label: string; color: string; val: number; tireId: string
  }) => (
    <div className="flex items-center gap-1">
      <span className="text-[9px] text-gray-400 w-9">{label}</span>
      <button type="button" disabled={adjusting === tireId || val === 0}
        onClick={() => { const t = tires.find(x => x.id === tireId); if (t) adjustAlloc(t, field, -1) }}
        className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-30 transition-colors">
        <Minus size={9} />
      </button>
      <span className={clsx('w-5 text-center font-bold text-xs tabular-nums', adjusting === tireId ? 'text-gray-300' : color)}>
        {adjusting === tireId ? '…' : val}
      </span>
      <button type="button" disabled={adjusting === tireId}
        onClick={() => { const t = tires.find(x => x.id === tireId); if (t) adjustAlloc(t, field, 1) }}
        className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-30 transition-colors">
        <Plus size={9} />
      </button>
    </div>
  )

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-brand-dark">Inventory</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            {tires.length} tire{tires.length !== 1 ? 's' : ''} · {totalUnits} total units
            {outCount > 0 && <span className="ml-2 text-red-500 font-semibold">· {outCount} out</span>}
            {lowCount > 0 && <span className="ml-2 text-yellow-600 font-semibold">· {lowCount} low</span>}
            {missingSkuCount > 0 && <span className="ml-2 text-red-500 font-semibold">· {missingSkuCount} SKU missing</span>}
          </p>
        </div>
        <button type="button" onClick={openAdd} className="btn-primary flex-shrink-0">
          <Plus size={16} /> Add Tire
        </button>
      </div>

      {/* HERO SEARCH */}
      <div className="bg-brand-dark rounded-2xl p-4 sm:p-6">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-3">Quick Stock Lookup</p>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            type="text"
            placeholder='Search by size (225/65R17), SKU, brand, or model'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-brand-gray border border-white/10 rounded-xl pl-10 pr-10 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
          />
          {search && (
            <button type="button" aria-label="Clear search" onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              <X size={16} />
            </button>
          )}
        </div>

        {search && !sizeSummary && (
          <p className="text-sm mt-3 min-h-[1.25rem]">
            {filtered.length === 0 ? (
              <span className="text-red-400 font-semibold">No results for &quot;{search}&quot;</span>
            ) : (
              <span className="text-gray-400">
                <span className="text-white font-bold">{filtered.length}</span> match{filtered.length !== 1 ? 'es' : ''}
              </span>
            )}
          </p>
        )}

        {/* Size summary — appears when searching a tire size */}
        {sizeSummary && (
          <div className="mt-3 bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-3">
              Available for this size · {filtered.length} entr{filtered.length !== 1 ? 'ies' : 'y'}
            </p>
            <div className="flex items-end gap-6 flex-wrap">
              <div className="text-center">
                <p className="text-3xl font-black text-emerald-400 leading-none">{sizeSummary.sets}</p>
                <p className="text-[10px] text-gray-500 mt-1">sets</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-purple-400 leading-none">{sizeSummary.pairs}</p>
                <p className="text-[10px] text-gray-500 mt-1">pairs</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-blue-400 leading-none">{sizeSummary.singles}</p>
                <p className="text-[10px] text-gray-500 mt-1">singles</p>
              </div>
              <div className="w-px h-8 bg-white/10 self-center" />
              <div className="text-center">
                <p className="text-3xl font-black text-white leading-none">{sizeSummary.total}</p>
                <p className="text-[10px] text-gray-500 mt-1">total tires</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <span className="text-gray-600 text-xs font-semibold">Show:</span>
          {([
            { key: 'single', label: 'Singles',   color: 'border-blue-400 text-blue-400',       active: 'bg-blue-500 text-white border-blue-500' },
            { key: 'pair',   label: 'Pairs+',    color: 'border-purple-400 text-purple-400',   active: 'bg-purple-500 text-white border-purple-500' },
            { key: 'set',    label: 'Full Sets', color: 'border-emerald-400 text-emerald-400', active: 'bg-emerald-500 text-white border-emerald-500' },
          ] as { key: StockFilter; label: string; color: string; active: string }[]).map(({ key, label, color, active }) => (
            <button key={key} type="button" onClick={() => setFilter(filter === key ? 'all' : key)}
              className={clsx('px-3 py-1 rounded-full text-xs font-bold border transition-all',
                filter === key ? active : `bg-transparent ${color} hover:opacity-80`)}>
              {label}
            </button>
          ))}
          {(filter === 'single' || filter === 'pair' || filter === 'set') && (
            <button type="button" onClick={() => setFilter('all')} className="text-gray-500 hover:text-white text-xs flex items-center gap-1">
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Analytics strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Package,    label: 'Total Units',                    value: totalUnits.toString(), color: 'bg-blue-50 text-blue-600' },
          { icon: DollarSign, label: 'Cost Value',                     value: `$${fmt(costVal)}`,    color: 'bg-purple-50 text-purple-600' },
          { icon: TrendingUp, label: 'Retail Value',                   value: `$${fmt(retailVal)}`,  color: 'bg-emerald-50 text-emerald-600' },
          { icon: BarChart2,  label: `Margin ${marginPct.toFixed(0)}%`, value: `$${fmt(margin)}`,    color: margin > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 shadow-sm">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>
              <Icon size={14} />
            </div>
            <p className="text-base sm:text-lg font-black text-brand-dark leading-tight">{value}</p>
            <p className="text-gray-400 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Unit availability summary */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { key: 'single' as StockFilter, count: singleCount, label: 'Singles', sub: 'exactly 1 unit',    active: 'bg-blue-50 border-blue-300',    num: 'text-blue-600',    hover: 'hover:border-blue-200' },
          { key: 'pair'   as StockFilter, count: pairCount,   label: 'Pairs',   sub: '2+ units',          active: 'bg-purple-50 border-purple-300', num: 'text-purple-600',  hover: 'hover:border-purple-200' },
          { key: 'set'    as StockFilter, count: setCount,    label: 'Full Sets',sub: '4+ units',          active: 'bg-emerald-50 border-emerald-300', num: 'text-emerald-600', hover: 'hover:border-emerald-200' },
        ].map(({ key, count, label, sub, active, num, hover }) => (
          <button key={key} type="button" onClick={() => setFilter(filter === key ? 'all' : key)}
            className={clsx('rounded-xl border p-2.5 sm:p-3 text-left transition-all',
              filter === key ? active : `bg-white border-gray-100 ${hover}`)}>
            <p className={clsx('text-lg sm:text-xl font-black', num)}>{count}</p>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">{label}</p>
            <p className="text-[10px] text-gray-400 hidden sm:block">{sub}</p>
          </button>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {([
          { key: 'all',      label: 'All',      count: tires.length },
          { key: 'in-stock', label: 'In Stock',  count: tires.filter((t) => t.quantity > 4).length },
          { key: 'low',      label: 'Low',       count: lowCount },
          { key: 'out',      label: 'Out',       count: outCount },
        ] as { key: StockFilter; label: string; count: number }[]).map(({ key, label, count }) => (
          <button key={key} type="button" onClick={() => setFilter(key)}
            className={clsx('px-3 sm:px-4 py-1.5 rounded-full text-sm font-semibold transition-all border',
              filter === key ? 'bg-brand-dark text-white border-brand-dark' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400')}>
            {label}
            <span className={clsx('ml-1.5 text-xs', filter === key ? 'text-gray-300' : 'text-gray-400')}>{count}</span>
          </button>
        ))}
      </div>

      {/* ── MOBILE CARD LIST ─────────────────────────────── */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">Loading inventory...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-gray-400 font-medium text-sm">{search ? `No results for "${search}"` : 'No tires yet.'}</p>
            {!search && <button type="button" onClick={openAdd} className="mt-3 text-brand-red text-sm font-semibold hover:underline">+ Add your first tire</button>}
          </div>
        ) : (
          filtered.map((t) => {
            const status      = stockStatus(t.quantity)
            const StatusIcon  = status.icon
            const isUsed      = t.brand.toLowerCase() === 'used'
            const breakdown   = isUsed ? null : stockBreakdown(t.quantity)
            const tireMargin  = parseFloat(t.price) - parseFloat(t.cost)
            const tirePct     = parseFloat(t.price) > 0 ? (tireMargin / parseFloat(t.price)) * 100 : 0
            const marginColor = tirePct >= 20 ? 'text-emerald-600' : tirePct >= 10 ? 'text-yellow-600' : 'text-red-500'
            const skuLabel    = t.sku?.trim()

            return (
              <div key={t.id} className={clsx('bg-white rounded-2xl border border-gray-100 p-4 shadow-sm', t.quantity === 0 && 'bg-red-50/40 border-red-100')}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-brand-dark leading-tight truncate">{isUsed ? 'Used Tire' : t.brand}</p>
                      {isUsed ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 flex-shrink-0"><Tag size={9} />Used</span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 flex-shrink-0"><Tag size={9} />New</span>
                      )}
                    </div>
                    {!isUsed && <p className="text-gray-400 text-xs truncate">{t.model}</p>}
                    <p className="font-mono text-xs text-gray-500 mt-0.5">{t.width}/{t.aspect}R{t.diameter}</p>
                    {!isUsed && (
                      <p className={clsx('font-mono text-[11px] mt-1 truncate', skuLabel ? 'text-gray-500' : 'text-red-500 font-semibold')}>
                        {skuLabel ? `SKU ${skuLabel}` : 'SKU missing'}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button type="button" onClick={() => openEdit(t)} className="p-2 hover:bg-blue-50 rounded-xl text-gray-400 hover:text-blue-600 transition-colors" aria-label="Edit"><Pencil size={15} /></button>
                    <button type="button" onClick={() => deleteTire(t.id, `${t.brand} ${t.model}`)} className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-brand-red transition-colors" aria-label="Delete"><Trash2 size={15} /></button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className={clsx('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold', status.color)}>
                    <StatusIcon size={11} />{status.label}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-start justify-between gap-3">
                    {isUsed ? (
                      <div className="space-y-1.5">
                        {([
                          { field: 'allocSets'    as const, label: 'Sets',    color: 'text-emerald-600', val: t.allocSets    ?? 0 },
                          { field: 'allocPairs'   as const, label: 'Pairs',   color: 'text-purple-600',  val: t.allocPairs   ?? 0 },
                          { field: 'allocSingles' as const, label: 'Singles', color: 'text-blue-600',    val: t.allocSingles ?? 0 },
                        ]).map(({ field, label, color, val }) => (
                          <div key={field} className="flex items-center gap-1.5">
                            <span className="text-[10px] text-gray-400 w-12">{label}</span>
                            <button type="button" disabled={adjusting === t.id || val === 0} onClick={() => adjustAlloc(t, field, -1)}
                              className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-30 transition-colors"><Minus size={10} /></button>
                            <span className={clsx('w-6 text-center font-bold text-sm tabular-nums', adjusting === t.id ? 'text-gray-300' : color)}>
                              {adjusting === t.id ? '…' : val}
                            </span>
                            <button type="button" disabled={adjusting === t.id} onClick={() => adjustAlloc(t, field, 1)}
                              className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-30 transition-colors"><Plus size={10} /></button>
                          </div>
                        ))}
                        <p className="text-[10px] text-gray-400 pl-14">{t.quantity} tires total</p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2">
                          <button type="button" aria-label="Decrease" disabled={adjusting === t.id || t.quantity === 0} onClick={() => adjustQty(t, -1)}
                            className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-30 transition-colors"><Minus size={13} /></button>
                          <span className="w-8 text-center font-bold text-brand-dark text-base tabular-nums">{adjusting === t.id ? '…' : t.quantity}</span>
                          <button type="button" aria-label="Increase" disabled={adjusting === t.id} onClick={() => adjustQty(t, 1)}
                            className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-30 transition-colors"><Plus size={13} /></button>
                        </div>
                        {breakdown && (
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            {breakdown.sets > 0 && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">{breakdown.sets} {breakdown.sets === 1 ? 'set' : 'sets'}</span>}
                            {breakdown.pairs > 0 && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">{breakdown.pairs} {breakdown.pairs === 1 ? 'pair' : 'pairs'}</span>}
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">{breakdown.singles} {breakdown.singles === 1 ? 'single' : 'singles'}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-brand-dark text-base">${parseFloat(t.price).toFixed(2)}</p>
                      <p className={clsx('text-xs font-semibold', marginColor)}>+${tireMargin.toFixed(2)} <span className="text-gray-400 font-normal">({tirePct.toFixed(0)}%)</span></p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── DESKTOP TABLE ─────────────────────────────── */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Brand / Model', 'SKU / Barcode', 'Size', 'Status', 'Units', 'Cost', 'Price', 'Margin', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">Loading inventory...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <p className="text-gray-400 font-medium">{search ? `No results for "${search}"` : 'No tires yet.'}</p>
                    {!search && <button type="button" onClick={openAdd} className="mt-3 text-brand-red text-sm font-semibold hover:underline">+ Add your first tire</button>}
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const status      = stockStatus(t.quantity)
                  const StatusIcon  = status.icon
                  const isUsed      = t.brand.toLowerCase() === 'used'
                  const breakdown   = isUsed ? null : stockBreakdown(t.quantity)
                  const tireMargin  = parseFloat(t.price) - parseFloat(t.cost)
                  const tirePct     = parseFloat(t.price) > 0 ? (tireMargin / parseFloat(t.price)) * 100 : 0
                  const marginColor = tirePct >= 20 ? 'text-emerald-600' : tirePct >= 10 ? 'text-yellow-600' : 'text-red-500'
                  const skuLabel    = t.sku?.trim()

                  return (
                    <tr key={t.id} className={clsx('transition-colors', t.quantity === 0 ? 'bg-red-50/30' : 'hover:bg-gray-50/60')}>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-brand-dark leading-tight">{isUsed ? 'Used Tire' : t.brand}</p>
                          {isUsed ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700"><Tag size={9} />Used</span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700"><Tag size={9} />New</span>
                          )}
                        </div>
                        {!isUsed && <p className="text-gray-400 text-xs">{t.model}</p>}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {isUsed ? <span className="text-gray-300 text-xs">—</span>
                          : skuLabel ? <span className="font-mono text-xs text-gray-600">{skuLabel}</span>
                          : <span className="text-red-500 text-xs font-semibold">SKU missing</span>}
                      </td>

                      <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">
                        {t.width}/{t.aspect}R{t.diameter}
                      </td>

                      <td className="px-4 py-3">
                        <span className={clsx('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap', status.color)}>
                          <StatusIcon size={11} />{status.label}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {isUsed ? (
                          <div className="space-y-0.5">
                            <AllocRow field="allocSets"    label="Sets"    color="text-emerald-600" val={t.allocSets    ?? 0} tireId={t.id} />
                            <AllocRow field="allocPairs"   label="Pairs"   color="text-purple-600"  val={t.allocPairs   ?? 0} tireId={t.id} />
                            <AllocRow field="allocSingles" label="Singles" color="text-blue-600"    val={t.allocSingles ?? 0} tireId={t.id} />
                            <p className="text-[9px] text-gray-400 pl-10 pt-0.5">{t.quantity} total</p>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5">
                              <button type="button" aria-label="Decrease" disabled={adjusting === t.id || t.quantity === 0} onClick={() => adjustQty(t, -1)}
                                className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-30 transition-colors"><Minus size={11} /></button>
                              <span className="w-7 text-center font-bold text-brand-dark text-sm tabular-nums">{adjusting === t.id ? '…' : t.quantity}</span>
                              <button type="button" aria-label="Increase" disabled={adjusting === t.id} onClick={() => adjustQty(t, 1)}
                                className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-30 transition-colors"><Plus size={11} /></button>
                            </div>
                            {breakdown && (
                              <div className="flex items-center gap-1 mt-1 flex-wrap">
                                {breakdown.sets > 0 && <span className="px-1 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">{breakdown.sets} {breakdown.sets === 1 ? 'set' : 'sets'}</span>}
                                {breakdown.pairs > 0 && <span className="px-1 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">{breakdown.pairs} {breakdown.pairs === 1 ? 'pair' : 'pairs'}</span>}
                                <span className="px-1 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">{breakdown.singles} {breakdown.singles === 1 ? 'single' : 'singles'}</span>
                              </div>
                            )}
                          </>
                        )}
                      </td>

                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">${parseFloat(t.cost).toFixed(2)}</td>
                      <td className="px-4 py-3 font-semibold text-brand-dark text-xs whitespace-nowrap">${parseFloat(t.price).toFixed(2)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={clsx('text-xs font-bold', marginColor)}>+${tireMargin.toFixed(2)}</span>
                        <span className="text-gray-400 text-xs"> ({tirePct.toFixed(0)}%)</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => openEdit(t)} className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors" aria-label="Edit"><Pencil size={13} /></button>
                          <button type="button" onClick={() => deleteTire(t.id, `${t.brand} ${t.model}`)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-brand-red transition-colors" aria-label="Delete"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-lg text-brand-dark">{editing ? 'Edit Tire' : 'Add Tire'}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4">

              {!editing && (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { used: false, label: 'New Tire',  sub: 'Has barcode / brand info' },
                    { used: true,  label: 'Used Tire', sub: 'Allocate by sets · pairs · singles' },
                  ].map(({ used, label, sub }) => (
                    <button key={String(used)} type="button"
                      onClick={() => { setUsedMode(used); setValue('brand', used ? 'Used' : '', { shouldValidate: false }) }}
                      className={clsx('flex flex-col items-center py-3 rounded-xl border-2 transition-all text-center',
                        usedMode === used
                          ? used ? 'bg-orange-500 border-orange-500 text-white' : 'bg-brand-dark border-brand-dark text-white'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400')}>
                      <span className="font-bold text-sm">{label}</span>
                      <span className={clsx('text-[10px] mt-0.5', usedMode === used ? 'opacity-80' : 'text-gray-400')}>{sub}</span>
                    </button>
                  ))}
                </div>
              )}

              {!usedMode && (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="admin-label">Brand *</label>
                      <input {...register('brand')} className="admin-input" placeholder="Michelin" />
                      {errors.brand && <p className="text-red-500 text-xs mt-1">{errors.brand.message}</p>}
                    </div>
                    <div>
                      <label className="admin-label">Model *</label>
                      <input {...register('model')} className="admin-input" placeholder="Defender2" />
                      {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model.message}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="admin-label">SKU / Barcode</label>
                    <input {...register('sku')} className="admin-input font-mono" placeholder="Scan or type barcode" />
                    {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku.message}</p>}
                  </div>
                </>
              )}

              <div>
                <label className="admin-label">Tire Size *</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <input {...register('width')} type="number" className="admin-input" placeholder="225" />
                    <p className="text-gray-400 text-[10px] mt-1 text-center">Width</p>
                    {errors.width && <p className="text-red-500 text-xs">{errors.width.message}</p>}
                  </div>
                  <div>
                    <input {...register('aspect')} type="number" className="admin-input" placeholder="65" />
                    <p className="text-gray-400 text-[10px] mt-1 text-center">Aspect</p>
                  </div>
                  <div>
                    <input {...register('diameter')} type="number" className="admin-input" placeholder="17" />
                    <p className="text-gray-400 text-[10px] mt-1 text-center">Diameter</p>
                  </div>
                </div>
              </div>

              {usedMode ? (
                <div>
                  <label className="admin-label">Allocate Stock</label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {[
                      { field: 'allocSets'    as const, label: 'Sets',    sub: '×4 tires' },
                      { field: 'allocPairs'   as const, label: 'Pairs',   sub: '×2 tires' },
                      { field: 'allocSingles' as const, label: 'Singles', sub: '×1 tire'  },
                    ].map(({ field, label, sub }) => (
                      <div key={field}>
                        <input {...register(field)} type="number" min="0" className="admin-input text-center" placeholder="0" />
                        <p className="text-gray-400 text-[10px] mt-1 text-center">{label} <span className="text-gray-300">({sub})</span></p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-50 rounded-xl px-3 py-2 flex items-center justify-between">
                    <p className="text-xs text-gray-500">Total tires</p>
                    <p className="text-sm font-black text-brand-dark">{allocTotal}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="admin-label">How Many? *</label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { qty: 1, label: 'Single',   sub: '1 tire',  activeColor: 'bg-blue-500 border-blue-500 text-white',      color: 'border-blue-300 hover:border-blue-500' },
                      { qty: 2, label: 'Pair',      sub: '2 tires', activeColor: 'bg-purple-500 border-purple-500 text-white',  color: 'border-purple-300 hover:border-purple-500' },
                      { qty: 4, label: 'Full Set',  sub: '4 tires', activeColor: 'bg-emerald-500 border-emerald-500 text-white',color: 'border-emerald-300 hover:border-emerald-500' },
                    ].map(({ qty, label, sub, color, activeColor }) => {
                      const isActive = Number(watchedQty) === qty
                      return (
                        <button key={qty} type="button" onClick={() => setValue('quantity', qty, { shouldValidate: true })}
                          className={clsx('flex flex-col items-center py-2.5 sm:py-3 rounded-xl border-2 transition-all text-center',
                            isActive ? activeColor : `bg-white border-gray-200 ${color} text-gray-700`)}>
                          <span className="text-xl font-black leading-none">{qty}</span>
                          <span className="text-xs font-bold mt-0.5">{label}</span>
                          <span className={clsx('text-[10px] hidden sm:block', isActive ? 'opacity-80' : 'text-gray-400')}>{sub}</span>
                        </button>
                      )
                    })}
                  </div>
                  <input {...register('quantity')} type="number" className="admin-input" placeholder="Or type a custom amount" />
                  {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="admin-label">Cost ($) *</label>
                  <input {...register('cost')} type="number" step="0.01" className="admin-input" placeholder="85.00" />
                  {errors.cost && <p className="text-red-500 text-xs mt-1">{errors.cost.message}</p>}
                </div>
                <div>
                  <label className="admin-label">Sell Price ($) *</label>
                  <input {...register('price')} type="number" step="0.01" className="admin-input" placeholder="129.00" />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                </div>
              </div>

              <div>
                <label className="admin-label">Notes</label>
                <input {...register('notes')} className="admin-input" placeholder="Any additional info..." />
              </div>

              <div className="flex gap-3 pt-2 pb-safe">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-brand-dark text-white rounded-xl py-3 text-sm font-bold hover:bg-black transition-colors disabled:opacity-60">
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
