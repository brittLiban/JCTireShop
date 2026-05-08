'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, X, Pencil, Trash2, Truck, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

type OrderStatus = 'SHIPPED' | 'RECEIVED' | 'PENDING' | 'CONFIRMED' | 'CANCELLED'

interface OrderItem {
  brand?: string
  model?: string
  width?: number
  aspect?: number
  diameter?: number
  qty: number
  unitCost: number
  name?: string // legacy
}

interface SupplierOrder {
  id: string
  supplier: string
  orderNumber?: string | null
  items: OrderItem[]
  totalCost: string
  status: OrderStatus
  orderedAt: string
  expectedAt?: string | null
  notes?: string | null
}

interface LineItem {
  _id: string
  brand: string
  model: string
  width: string
  aspect: string
  diameter: string
  qty: string
  unitCost: string
}

const STATUS_DISPLAY: Record<string, { label: string; color: string }> = {
  SHIPPED:   { label: 'In Transit', color: 'bg-amber-50 text-amber-700 border border-amber-200' },
  RECEIVED:  { label: 'Received',   color: 'bg-green-50 text-green-700 border border-green-200' },
  PENDING:   { label: 'Pending',    color: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
  CONFIRMED: { label: 'Confirmed',  color: 'bg-blue-50 text-blue-700 border border-blue-200' },
  CANCELLED: { label: 'Cancelled',  color: 'bg-gray-50 text-gray-500 border border-gray-200' },
}

function newLine(): LineItem {
  return {
    _id: Math.random().toString(36).slice(2),
    brand: '', model: '', width: '', aspect: '', diameter: '', qty: '', unitCost: '',
  }
}

function lineTotal(l: LineItem): number {
  const q = parseFloat(l.qty)
  const c = parseFloat(l.unitCost)
  return isNaN(q) || isNaN(c) ? 0 : q * c
}

function formatItemSummary(item: OrderItem): string {
  const name = item.brand
    ? `${item.brand}${item.model ? ` ${item.model}` : ''}${item.width ? ` ${item.width}/${item.aspect}R${item.diameter}` : ''}`
    : (item.name ?? '')
  return `${item.qty}× ${name}`
}

export default function OrdersPage() {
  const [orders,    setOrders]    = useState<SupplierOrder[]>([])
  const [loading,   setLoading]   = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<SupplierOrder | null>(null)
  const [saving,    setSaving]    = useState(false)

  // Form fields
  const [supplier,        setSupplier]        = useState('')
  const [newSupplierMode, setNewSupplierMode] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')
  const [orderNumber,     setOrderNumber]     = useState('')
  const [status,          setStatus]          = useState<'SHIPPED' | 'RECEIVED'>('SHIPPED')
  const [expectedAt,      setExpectedAt]      = useState('')
  const [notes,           setNotes]           = useState('')
  const [lines,           setLines]           = useState<LineItem[]>([newLine()])

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

  const knownSuppliers = Array.from(new Set(orders.map((o) => o.supplier))).sort()

  const resetForm = () => {
    const first = knownSuppliers[0] ?? ''
    setSupplier(first)
    setNewSupplierMode(knownSuppliers.length === 0)
    setNewSupplierName('')
    setOrderNumber('')
    setStatus('SHIPPED')
    setExpectedAt('')
    setNotes('')
    setLines([newLine()])
  }

  const openAdd = () => {
    setEditing(null)
    resetForm()
    setModalOpen(true)
  }

  const openEdit = (o: SupplierOrder) => {
    setEditing(o)
    setSupplier(o.supplier)
    setNewSupplierMode(false)
    setNewSupplierName('')
    setOrderNumber(o.orderNumber ?? '')
    setStatus(o.status === 'RECEIVED' ? 'RECEIVED' : 'SHIPPED')
    setExpectedAt(o.expectedAt ? o.expectedAt.slice(0, 10) : '')
    setNotes(o.notes ?? '')
    setLines(
      o.items.length > 0
        ? o.items.map((i) => ({
            _id:      Math.random().toString(36).slice(2),
            brand:    i.brand ?? (i.name ?? ''),
            model:    i.model ?? '',
            width:    i.width    ? String(i.width)    : '',
            aspect:   i.aspect   ? String(i.aspect)   : '',
            diameter: i.diameter ? String(i.diameter) : '',
            qty:      String(i.qty),
            unitCost: String(i.unitCost),
          }))
        : [newLine()]
    )
    setModalOpen(true)
  }

  const totalCost = lines.reduce((s, l) => s + lineTotal(l), 0)

  const updateLine = (id: string, field: keyof Omit<LineItem, '_id'>, val: string) =>
    setLines((prev) => prev.map((l) => l._id === id ? { ...l, [field]: val } : l))

  const addLine    = () => setLines((prev) => [...prev, newLine()])
  const removeLine = (id: string) => setLines((prev) => prev.filter((l) => l._id !== id))

  const resolvedSupplier = newSupplierMode ? newSupplierName.trim() : supplier

  const handleSave = async () => {
    if (!resolvedSupplier) { toast.error('Supplier name is required'); return }
    const validLines = lines.filter((l) => l.brand.trim() || l.qty)
    if (validLines.length === 0) { toast.error('Add at least one item'); return }
    for (const l of validLines) {
      if (!l.brand.trim())                                           { toast.error('Each item needs a brand'); return }
      if (!l.qty || parseFloat(l.qty) <= 0)                         { toast.error('Each item needs a valid quantity'); return }
      if (!l.unitCost || parseFloat(l.unitCost) <= 0)               { toast.error('Each item needs a unit cost'); return }
    }

    setSaving(true)
    const payload = {
      supplier:    resolvedSupplier,
      orderNumber: orderNumber.trim() || undefined,
      items: validLines.map((l) => ({
        brand:    l.brand.trim(),
        model:    l.model.trim(),
        width:    parseInt(l.width)    || 0,
        aspect:   parseInt(l.aspect)   || 0,
        diameter: parseInt(l.diameter) || 0,
        qty:      parseFloat(l.qty),
        unitCost: parseFloat(l.unitCost),
      })),
      totalCost,
      status,
      expectedAt: expectedAt || null,
      notes: notes.trim() || undefined,
    }
    try {
      const url    = editing ? `/api/admin/orders/${editing.id}` : '/api/admin/orders'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      toast.success(editing ? 'Order updated!' : 'Order placed!')
      setModalOpen(false)
      fetchOrders()
    } catch {
      toast.error('Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const markReceived = async (o: SupplierOrder) => {
    try {
      const res = await fetch(`/api/admin/orders/${o.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RECEIVED', receivedAt: new Date().toISOString() }),
      })
      if (!res.ok) throw new Error()
      setOrders((prev) => prev.map((x) => x.id === o.id ? { ...x, status: 'RECEIVED' as OrderStatus } : x))
      toast.success('Marked as received!')
    } catch {
      toast.error('Failed to update.')
    }
  }

  const deleteOrder = async (id: string, supplierName: string) => {
    if (!confirm(`Delete order from "${supplierName}"?`)) return
    try {
      const res = await fetch(`/api/admin/orders/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setOrders((prev) => prev.filter((o) => o.id !== id))
      toast.success('Order deleted.')
    } catch {
      toast.error('Failed to delete.')
    }
  }

  const inTransitCount = orders.filter((o) => o.status === 'SHIPPED' || o.status === 'PENDING' || o.status === 'CONFIRMED').length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-dark">Supplier Orders</h1>
          <p className="text-gray-500 text-sm mt-1">
            {orders.length} order{orders.length !== 1 ? 's' : ''}
            {inTransitCount > 0 && (
              <span className="ml-2 text-amber-600 font-semibold">· {inTransitCount} in transit</span>
            )}
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary flex-shrink-0">
          <Plus size={16} /> New Order
        </button>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Supplier', 'Items', 'Total', 'Status', 'Ordered', 'Expected', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Loading orders...</td></tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <Truck size={32} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No orders yet. Create one to get started.</p>
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const statusInfo = STATUS_DISPLAY[o.status] ?? STATUS_DISPLAY.SHIPPED
                  const isActive   = o.status !== 'RECEIVED' && o.status !== 'CANCELLED'
                  return (
                    <tr key={o.id} className="hover:bg-gray-50/60 transition-colors">

                      <td className="px-4 py-3">
                        <p className="font-semibold text-brand-dark">{o.supplier}</p>
                        {o.orderNumber && <p className="font-mono text-[11px] text-gray-400">#{o.orderNumber}</p>}
                      </td>

                      <td className="px-4 py-3 max-w-[200px]">
                        <div className="space-y-0.5">
                          {o.items.slice(0, 3).map((item, i) => (
                            <p key={i} className="text-xs text-gray-600 truncate">{formatItemSummary(item)}</p>
                          ))}
                          {o.items.length > 3 && (
                            <p className="text-[11px] text-gray-400">+{o.items.length - 3} more</p>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-semibold text-brand-dark whitespace-nowrap">
                        ${parseFloat(o.totalCost).toFixed(2)}
                      </td>

                      <td className="px-4 py-3">
                        <span className={clsx('px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap', statusInfo.color)}>
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(o.orderedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>

                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {o.expectedAt
                          ? new Date(o.expectedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : '—'}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {isActive && (
                            <button onClick={() => markReceived(o)}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap">
                              <Check size={11} /> Received
                            </button>
                          )}
                          <button onClick={() => openEdit(o)}
                            className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors" aria-label="Edit">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => deleteOrder(o.id, o.supplier)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-brand-red transition-colors" aria-label="Delete">
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

      {/* ── Modal ─────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-3xl shadow-2xl max-h-[92vh] overflow-y-auto">

            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-lg text-brand-dark">{editing ? 'Edit Order' : 'New Supplier Order'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={18} /></button>
            </div>

            <div className="p-5 space-y-5">

              {/* ── Supplier + Order # ── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="admin-label">Supplier *</label>
                  {!newSupplierMode ? (
                    <select
                      value={supplier}
                      onChange={(e) => {
                        if (e.target.value === '__new__') { setNewSupplierMode(true); setSupplier('') }
                        else setSupplier(e.target.value)
                      }}
                      className="admin-select"
                    >
                      {knownSuppliers.map((s) => <option key={s} value={s}>{s}</option>)}
                      <option value="__new__">＋ Add new supplier…</option>
                    </select>
                  ) : (
                    <div className="flex gap-1.5">
                      <input
                        autoFocus
                        value={newSupplierName}
                        onChange={(e) => setNewSupplierName(e.target.value)}
                        className="admin-input flex-1"
                        placeholder="Supplier name"
                      />
                      {knownSuppliers.length > 0 && (
                        <button type="button"
                          onClick={() => { setNewSupplierMode(false); setSupplier(knownSuppliers[0]) }}
                          className="p-2 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-lg">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="admin-label">Order # <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)}
                    className="admin-input" placeholder="PO-12345" />
                </div>
              </div>

              {/* ── Line items ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="admin-label mb-0">Items *</label>
                  <span className="text-[11px] text-gray-400">qty × unit cost = line total</span>
                </div>

                {/* Column headers */}
                <div className="hidden sm:grid sm:grid-cols-[1.2fr_1fr_3.5rem_3rem_3rem_3.5rem_5rem_1.75rem] gap-1.5 px-0.5 mb-1">
                  {['Brand', 'Model', 'Width', 'Asp.', 'Dia.', 'Qty', '$/unit', ''].map((h) => (
                    <p key={h} className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide text-center">{h}</p>
                  ))}
                </div>

                <div className="space-y-2">
                  {lines.map((l) => (
                    <div key={l._id} className="sm:grid sm:grid-cols-[1.2fr_1fr_3.5rem_3rem_3rem_3.5rem_5rem_1.75rem] gap-1.5 flex flex-col">
                      <input value={l.brand} onChange={(e) => updateLine(l._id, 'brand', e.target.value)}
                        className="admin-input text-sm" placeholder="Brand" />
                      <input value={l.model} onChange={(e) => updateLine(l._id, 'model', e.target.value)}
                        className="admin-input text-sm" placeholder="Model" />
                      <input value={l.width} onChange={(e) => updateLine(l._id, 'width', e.target.value)}
                        className="admin-input text-sm text-center" placeholder="225" type="number" />
                      <input value={l.aspect} onChange={(e) => updateLine(l._id, 'aspect', e.target.value)}
                        className="admin-input text-sm text-center" placeholder="65" type="number" />
                      <input value={l.diameter} onChange={(e) => updateLine(l._id, 'diameter', e.target.value)}
                        className="admin-input text-sm text-center" placeholder="17" type="number" />
                      <input value={l.qty} onChange={(e) => updateLine(l._id, 'qty', e.target.value)}
                        className="admin-input text-sm text-center" placeholder="4" type="number" min="1" />
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                        <input value={l.unitCost} onChange={(e) => updateLine(l._id, 'unitCost', e.target.value)}
                          className="admin-input text-sm pl-5 text-right" placeholder="85.00" type="number" step="0.01" />
                      </div>
                      <button type="button" onClick={() => removeLine(l._id)} disabled={lines.length === 1}
                        className="h-9 w-7 flex items-center justify-center text-gray-300 hover:text-red-500 disabled:opacity-20 transition-colors rounded-lg hover:bg-red-50 self-center">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-3">
                  <button type="button" onClick={addLine}
                    className="flex items-center gap-1.5 text-xs text-brand-dark font-semibold py-1.5 px-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                    <Plus size={12} /> Add line
                  </button>
                  <div className="text-right">
                    <p className="text-[11px] text-gray-400 uppercase tracking-wide">Order Total</p>
                    <p className="text-xl font-black text-brand-dark">${totalCost.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* ── Status ── */}
              <div>
                <label className="admin-label">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'SHIPPED',  label: 'In Transit', sub: 'Order placed, awaiting arrival', active: 'bg-amber-500 border-amber-500 text-white' },
                    { value: 'RECEIVED', label: 'Received',   sub: 'Stock has arrived',               active: 'bg-green-500 border-green-500 text-white' },
                  ] as { value: 'SHIPPED' | 'RECEIVED'; label: string; sub: string; active: string }[]).map(({ value, label, sub, active }) => (
                    <button key={value} type="button" onClick={() => setStatus(value)}
                      className={clsx('flex flex-col items-center py-3 rounded-xl border-2 transition-all',
                        status === value ? active : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400')}>
                      <span className="font-bold text-sm">{label}</span>
                      <span className={clsx('text-[10px] mt-0.5', status === value ? 'opacity-80' : 'text-gray-400')}>{sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Expected + Notes ── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="admin-label">Expected Delivery <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input type="date" value={expectedAt} onChange={(e) => setExpectedAt(e.target.value)} className="admin-input" />
                </div>
                <div>
                  <label className="admin-label">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input value={notes} onChange={(e) => setNotes(e.target.value)} className="admin-input" placeholder="Any notes about this order…" />
                </div>
              </div>

              {/* ── Actions ── */}
              <div className="flex gap-3 pt-1 pb-safe">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={handleSave} disabled={saving}
                  className="flex-1 bg-brand-dark text-white rounded-xl py-3 text-sm font-bold hover:bg-black transition-colors disabled:opacity-60">
                  {saving ? 'Saving…' : editing ? 'Update Order' : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
