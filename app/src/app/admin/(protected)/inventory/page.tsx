'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus, X, Pencil, Trash2, AlertTriangle,
  DollarSign, TrendingUp, BarChart2, Package,
  Search, MapPin, CheckCircle2, XCircle, Minus,
} from 'lucide-react'
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
  location?: string | null
  notes?: string | null
}

const schema = z.object({
  brand:    z.string().min(1, 'Required').max(100),
  model:    z.string().min(1, 'Required').max(100),
  width:    z.coerce.number({ invalid_type_error: 'Required' }).int().positive(),
  aspect:   z.coerce.number({ invalid_type_error: 'Required' }).int().positive(),
  diameter: z.coerce.number({ invalid_type_error: 'Required' }).int().positive(),
  quantity: z.coerce.number({ invalid_type_error: 'Required' }).int().min(0),
  cost:     z.coerce.number({ invalid_type_error: 'Required' }).positive(),
  price:    z.coerce.number({ invalid_type_error: 'Required' }).positive(),
  location: z.string().max(100).optional(),
  notes:    z.string().max(500).optional(),
})

type FormData = z.infer<typeof schema>
type StockFilter = 'all' | 'in-stock' | 'low' | 'out' | 'single' | 'pair' | 'set'

function parseSizeQuery(q: string): { width?: number; aspect?: number; diameter?: number } {
  const clean = q.replace(/[rR]/g, ' ').replace(/[/,]/g, ' ').trim()
  const parts = clean.split(/\s+/).map(Number).filter((n) => !isNaN(n) && n > 0)
  if (parts.length === 3) return { width: parts[0], aspect: parts[1], diameter: parts[2] }
  if (parts.length === 2) return { width: parts[0], diameter: parts[1] }
  return {}
}

function stockStatus(qty: number) {
  if (qty === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700',       icon: XCircle,       dot: 'bg-red-500' }
  if (qty <= 4)  return { label: 'Low Stock',    color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle, dot: 'bg-yellow-500' }
  return               { label: 'In Stock',      color: 'bg-green-100 text-green-700',   icon: CheckCircle2,  dot: 'bg-green-500' }
}

function unitBadge(qty: number): { label: string; color: string } | null {
  if (qty === 0) return null
  if (qty === 1) return { label: 'Single',  color: 'bg-blue-100 text-blue-700' }
  if (qty === 2) return { label: 'Pair',    color: 'bg-purple-100 text-purple-700' }
  if (qty === 3) return { label: '3 — Pair+', color: 'bg-purple-100 text-purple-700' }
  if (qty % 4 === 0) return { label: `${qty / 4 === 1 ? 'Set of 4' : `${qty / 4}x Sets`}`, color: 'bg-emerald-100 text-emerald-700' }
  return { label: `${qty} units`, color: 'bg-gray-100 text-gray-600' }
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

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const watchedQty = watch('quantity')

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
    if (filter === 'in-stock' && t.quantity <= 4) return false
    if (filter === 'low'      && !(t.quantity > 0 && t.quantity <= 4)) return false
    if (filter === 'out'      && t.quantity !== 0) return false
    if (filter === 'single'   && t.quantity !== 1) return false
    if (filter === 'pair'     && t.quantity < 2) return false
    if (filter === 'set'      && t.quantity < 4) return false

    if (search === '') return true

    const size = parseSizeQuery(search)
    if (size.width || size.diameter) {
      return (
        (!size.width    || t.width    === size.width)    &&
        (!size.aspect   || t.aspect   === size.aspect)   &&
        (!size.diameter || t.diameter === size.diameter)
      )
    }

    const q = search.toLowerCase()
    return (
      t.brand.toLowerCase().includes(q)    ||
      t.model.toLowerCase().includes(q)    ||
      (t.location ?? '').toLowerCase().includes(q)
    )
  })

  const adjustQty = async (t: Tire, delta: number) => {
    const newQty = Math.max(0, t.quantity + delta)
    setAdjusting(t.id)
    try {
      const res = await fetch(`/api/admin/tires/${t.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty }),
      })
      if (!res.ok) throw new Error()
      setTires((prev) => prev.map((x) => x.id === t.id ? { ...x, quantity: newQty } : x))
    } catch {
      toast.error('Failed to update quantity')
    } finally {
      setAdjusting(null)
    }
  }

  const openAdd = () => {
    setEditing(null)
    reset({ quantity: 0 })
    setModalOpen(true)
  }

  const openEdit = (t: Tire) => {
    setEditing(t)
    reset({
      brand: t.brand, model: t.model,
      width: t.width, aspect: t.aspect, diameter: t.diameter,
      quantity: t.quantity,
      cost: parseFloat(t.cost), price: parseFloat(t.price),
      location: t.location ?? '',
      notes: t.notes ?? '',
    })
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const url    = editing ? `/api/admin/tires/${editing.id}` : '/api/admin/tires'
      const method = editing ? 'PUT' : 'POST'
      const res    = await fetch(url, {
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

  const fmt        = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const totalUnits = tires.reduce((s, t) => s + t.quantity, 0)
  const costVal    = tires.reduce((s, t) => s + parseFloat(t.cost)  * t.quantity, 0)
  const retailVal  = tires.reduce((s, t) => s + parseFloat(t.price) * t.quantity, 0)
  const margin     = retailVal - costVal
  const marginPct  = retailVal > 0 ? (margin / retailVal) * 100 : 0
  const lowCount   = tires.filter((t) => t.quantity > 0 && t.quantity <= 4).length
  const outCount   = tires.filter((t) => t.quantity === 0).length
  const singleCount = tires.filter((t) => t.quantity === 1).length
  const pairCount   = tires.filter((t) => t.quantity >= 2).length
  const setCount    = tires.filter((t) => t.quantity >= 4).length

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-brand-dark">Inventory</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            {tires.length} SKU{tires.length !== 1 ? 's' : ''} · {totalUnits} total units
            {outCount > 0 && <span className="ml-2 text-red-500 font-semibold">· {outCount} out</span>}
            {lowCount > 0 && <span className="ml-2 text-yellow-600 font-semibold">· {lowCount} low</span>}
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
            placeholder='Brand, model, or size like "225/65R17"'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-brand-gray border border-white/10 rounded-xl pl-10 pr-10 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {search && (
          <p className="text-sm mt-3 min-h-[1.25rem]">
            {filtered.length === 0 ? (
              <span className="text-red-400 font-semibold">No results for &quot;{search}&quot;</span>
            ) : (
              <span className="text-gray-400">
                <span className="text-white font-bold">{filtered.length}</span> match{filtered.length !== 1 ? 'es' : ''}
                {filtered.some((t) => t.quantity >= 4) && <span className="text-emerald-400 font-semibold ml-2">· Full set ✓</span>}
                {filtered.some((t) => t.quantity >= 2) && !filtered.some((t) => t.quantity >= 4) && <span className="text-purple-400 font-semibold ml-2">· Pair ✓</span>}
                {filtered.every((t) => t.quantity === 0) && <span className="text-red-400 font-semibold ml-2">· All out of stock</span>}
              </span>
            )}
          </p>
        )}

        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <span className="text-gray-600 text-xs font-semibold">Show:</span>
          {([
            { key: 'single', label: 'Singles',  color: 'border-blue-400 text-blue-400',    active: 'bg-blue-500 text-white border-blue-500' },
            { key: 'pair',   label: 'Pairs+',   color: 'border-purple-400 text-purple-400', active: 'bg-purple-500 text-white border-purple-500' },
            { key: 'set',    label: 'Full Sets', color: 'border-emerald-400 text-emerald-400', active: 'bg-emerald-500 text-white border-emerald-500' },
          ] as { key: StockFilter; label: string; color: string; active: string }[]).map(({ key, label, color, active }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(filter === key ? 'all' : key)}
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-bold border transition-all',
                filter === key ? active : `bg-transparent ${color} hover:opacity-80`
              )}
            >
              {label}
            </button>
          ))}
          {(filter === 'single' || filter === 'pair' || filter === 'set') && (
            <button
              type="button"
              onClick={() => setFilter('all')}
              className="text-gray-500 hover:text-white text-xs flex items-center gap-1"
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Analytics strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Package,    label: 'Total Units',              value: totalUnits.toString(), color: 'bg-blue-50 text-blue-600' },
          { icon: DollarSign, label: 'Cost Value',               value: `$${fmt(costVal)}`,    color: 'bg-purple-50 text-purple-600' },
          { icon: TrendingUp, label: 'Retail Value',             value: `$${fmt(retailVal)}`,  color: 'bg-emerald-50 text-emerald-600' },
          { icon: BarChart2,  label: `Margin ${marginPct.toFixed(0)}%`, value: `$${fmt(margin)}`, color: margin > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600' },
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
        <button
          type="button"
          onClick={() => setFilter(filter === 'single' ? 'all' : 'single')}
          className={clsx(
            'rounded-xl border p-2.5 sm:p-3 text-left transition-all',
            filter === 'single' ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-100 hover:border-blue-200'
          )}
        >
          <p className="text-lg sm:text-xl font-black text-blue-600">{singleCount}</p>
          <p className="text-xs font-semibold text-gray-500 mt-0.5">Singles</p>
          <p className="text-[10px] text-gray-400 hidden sm:block">exactly 1 unit</p>
        </button>
        <button
          type="button"
          onClick={() => setFilter(filter === 'pair' ? 'all' : 'pair')}
          className={clsx(
            'rounded-xl border p-2.5 sm:p-3 text-left transition-all',
            filter === 'pair' ? 'bg-purple-50 border-purple-300' : 'bg-white border-gray-100 hover:border-purple-200'
          )}
        >
          <p className="text-lg sm:text-xl font-black text-purple-600">{pairCount}</p>
          <p className="text-xs font-semibold text-gray-500 mt-0.5">Pairs</p>
          <p className="text-[10px] text-gray-400 hidden sm:block">2+ units available</p>
        </button>
        <button
          type="button"
          onClick={() => setFilter(filter === 'set' ? 'all' : 'set')}
          className={clsx(
            'rounded-xl border p-2.5 sm:p-3 text-left transition-all',
            filter === 'set' ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-gray-100 hover:border-emerald-200'
          )}
        >
          <p className="text-lg sm:text-xl font-black text-emerald-600">{setCount}</p>
          <p className="text-xs font-semibold text-gray-500 mt-0.5">Full Sets</p>
          <p className="text-[10px] text-gray-400 hidden sm:block">4+ units available</p>
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {([
          { key: 'all',      label: 'All',      count: tires.length },
          { key: 'in-stock', label: 'In Stock',  count: tires.filter((t) => t.quantity > 4).length },
          { key: 'low',      label: 'Low',       count: lowCount },
          { key: 'out',      label: 'Out',       count: outCount },
        ] as { key: StockFilter; label: string; count: number }[]).map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={clsx(
              'px-3 sm:px-4 py-1.5 rounded-full text-sm font-semibold transition-all border',
              filter === key
                ? 'bg-brand-dark text-white border-brand-dark'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            )}
          >
            {label}
            <span className={clsx('ml-1.5 text-xs', filter === key ? 'text-gray-300' : 'text-gray-400')}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── MOBILE CARD LIST (hidden on sm+) ─────────────────────────────── */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
            Loading inventory...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-gray-400 font-medium text-sm">
              {search ? `No results for "${search}"` : 'No tires yet.'}
            </p>
            {!search && (
              <button type="button" onClick={openAdd} className="mt-3 text-brand-red text-sm font-semibold hover:underline">
                + Add your first tire
              </button>
            )}
          </div>
        ) : (
          filtered.map((t) => {
            const status      = stockStatus(t.quantity)
            const StatusIcon  = status.icon
            const badge       = unitBadge(t.quantity)
            const tireMargin  = parseFloat(t.price) - parseFloat(t.cost)
            const tirePct     = parseFloat(t.price) > 0 ? (tireMargin / parseFloat(t.price)) * 100 : 0
            const marginColor = tirePct >= 20 ? 'text-emerald-600' : tirePct >= 10 ? 'text-yellow-600' : 'text-red-500'

            return (
              <div
                key={t.id}
                className={clsx(
                  'bg-white rounded-2xl border border-gray-100 p-4 shadow-sm',
                  t.quantity === 0 && 'bg-red-50/40 border-red-100'
                )}
              >
                {/* Top row: brand/model + actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-brand-dark leading-tight truncate">{t.brand}</p>
                    <p className="text-gray-400 text-xs truncate">{t.model}</p>
                    <p className="font-mono text-xs text-gray-500 mt-0.5">{t.width}/{t.aspect}R{t.diameter}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(t)}
                      className="p-2 hover:bg-blue-50 rounded-xl text-gray-400 hover:text-blue-600 transition-colors"
                      aria-label="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTire(t.id, `${t.brand} ${t.model}`)}
                      className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-brand-red transition-colors"
                      aria-label="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Status + location */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className={clsx('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold', status.color)}>
                    <StatusIcon size={11} />
                    {status.label}
                  </span>
                  {t.location && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin size={11} className="text-brand-red flex-shrink-0" />
                      {t.location}
                    </span>
                  )}
                </div>

                {/* Bottom row: qty controls + price/margin */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  {/* Qty adjust */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      disabled={adjusting === t.id || t.quantity === 0}
                      onClick={() => adjustQty(t, -1)}
                      className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-30 transition-colors"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-8 text-center font-bold text-brand-dark text-base tabular-nums">
                      {adjusting === t.id ? '…' : t.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      disabled={adjusting === t.id}
                      onClick={() => adjustQty(t, 1)}
                      className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-30 transition-colors"
                    >
                      <Plus size={13} />
                    </button>
                    {badge && (
                      <span className={clsx('px-2 py-0.5 rounded text-[10px] font-bold', badge.color)}>
                        {badge.label}
                      </span>
                    )}
                  </div>

                  {/* Price + margin */}
                  <div className="text-right">
                    <p className="font-bold text-brand-dark text-base">${parseFloat(t.price).toFixed(2)}</p>
                    <p className={clsx('text-xs font-semibold', marginColor)}>
                      +${tireMargin.toFixed(2)} <span className="text-gray-400 font-normal">({tirePct.toFixed(0)}%)</span>
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── DESKTOP TABLE (hidden on mobile) ─────────────────────────────── */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Brand / Model', 'Size', 'Status', 'Units', 'Location', 'Cost', 'Price', 'Margin', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">Loading inventory...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <p className="text-gray-400 font-medium">
                      {search ? `No results for "${search}"` : 'No tires yet.'}
                    </p>
                    {!search && (
                      <button type="button" onClick={openAdd} className="mt-3 text-brand-red text-sm font-semibold hover:underline">
                        + Add your first tire
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const status     = stockStatus(t.quantity)
                  const StatusIcon = status.icon
                  const badge      = unitBadge(t.quantity)
                  const tireMargin = parseFloat(t.price) - parseFloat(t.cost)
                  const tirePct    = parseFloat(t.price) > 0 ? (tireMargin / parseFloat(t.price)) * 100 : 0
                  const marginColor = tirePct >= 20 ? 'text-emerald-600' : tirePct >= 10 ? 'text-yellow-600' : 'text-red-500'

                  return (
                    <tr key={t.id} className={clsx('transition-colors', t.quantity === 0 ? 'bg-red-50/30' : 'hover:bg-gray-50/60')}>

                      <td className="px-4 py-3">
                        <p className="font-semibold text-brand-dark leading-tight">{t.brand}</p>
                        <p className="text-gray-400 text-xs">{t.model}</p>
                      </td>

                      <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">
                        {t.width}/{t.aspect}R{t.diameter}
                      </td>

                      <td className="px-4 py-3">
                        <span className={clsx('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap', status.color)}>
                          <StatusIcon size={11} />
                          {status.label}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            disabled={adjusting === t.id || t.quantity === 0}
                            onClick={() => adjustQty(t, -1)}
                            className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-30 transition-colors"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="w-7 text-center font-bold text-brand-dark text-sm tabular-nums">
                            {adjusting === t.id ? '…' : t.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            disabled={adjusting === t.id}
                            onClick={() => adjustQty(t, 1)}
                            className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-30 transition-colors"
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                        {badge && (
                          <span className={clsx('mt-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-bold', badge.color)}>
                            {badge.label}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {t.location ? (
                          <span className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                            <MapPin size={11} className="text-brand-red flex-shrink-0" />
                            {t.location}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        ${parseFloat(t.cost).toFixed(2)}
                      </td>

                      <td className="px-4 py-3 font-semibold text-brand-dark text-xs whitespace-nowrap">
                        ${parseFloat(t.price).toFixed(2)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={clsx('text-xs font-bold', marginColor)}>
                          +${tireMargin.toFixed(2)}
                        </span>
                        <span className="text-gray-400 text-xs"> ({tirePct.toFixed(0)}%)</span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(t)}
                            className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                            aria-label="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTire(t.id, `${t.brand} ${t.model}`)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-brand-red transition-colors"
                            aria-label="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
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
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false) }}
        >
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-lg text-brand-dark">{editing ? 'Edit Tire' : 'Add Tire'}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4">

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

              <div>
                <label className="admin-label">How Many? *</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { qty: 1, label: 'Single',  sub: '1 tire',  color: 'border-blue-300 hover:border-blue-500',    activeColor: 'bg-blue-500 border-blue-500 text-white' },
                    { qty: 2, label: 'Pair',    sub: '2 tires', color: 'border-purple-300 hover:border-purple-500', activeColor: 'bg-purple-500 border-purple-500 text-white' },
                    { qty: 4, label: 'Full Set',sub: '4 tires', color: 'border-emerald-300 hover:border-emerald-500', activeColor: 'bg-emerald-500 border-emerald-500 text-white' },
                  ].map(({ qty, label, sub, color, activeColor }) => {
                    const isActive = Number(watchedQty) === qty
                    return (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => setValue('quantity', qty, { shouldValidate: true })}
                        className={clsx(
                          'flex flex-col items-center py-2.5 sm:py-3 rounded-xl border-2 transition-all text-center',
                          isActive ? activeColor : `bg-white border-gray-200 ${color} text-gray-700`
                        )}
                      >
                        <span className="text-xl font-black leading-none">{qty}</span>
                        <span className="text-xs font-bold mt-0.5">{label}</span>
                        <span className={clsx('text-[10px] hidden sm:block', isActive ? 'opacity-80' : 'text-gray-400')}>{sub}</span>
                      </button>
                    )
                  })}
                </div>
                <input
                  {...register('quantity')}
                  type="number"
                  className="admin-input"
                  placeholder="Or type a custom amount"
                />
                {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>}
              </div>

              <div>
                <label className="admin-label">Location</label>
                <input {...register('location')} className="admin-input" placeholder="Bay 1 · Shelf A" />
              </div>

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
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-brand-dark text-white rounded-xl py-3 text-sm font-bold hover:bg-black transition-colors disabled:opacity-60"
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
