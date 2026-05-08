'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, X, Pencil, Trash2, DollarSign, RefreshCw, Receipt } from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

interface GeneralExpense {
  id:          string
  name:        string
  category:    string
  amount:      string
  isRecurring: boolean
  recurDay?:   number | null
  notes?:      string | null
  paidAt:      string
}

type TabFilter = 'all' | 'recurring' | 'one-time'

const CATEGORIES: { key: string; label: string; color: string }[] = [
  { key: 'RENT',        label: 'Rent',        color: 'bg-blue-100 text-blue-700' },
  { key: 'UTILITIES',   label: 'Utilities',   color: 'bg-yellow-100 text-yellow-700' },
  { key: 'INSURANCE',   label: 'Insurance',   color: 'bg-green-100 text-green-700' },
  { key: 'SUPPLIES',    label: 'Supplies',    color: 'bg-purple-100 text-purple-700' },
  { key: 'FUEL',        label: 'Fuel',        color: 'bg-orange-100 text-orange-700' },
  { key: 'EQUIPMENT',   label: 'Equipment',   color: 'bg-gray-100 text-gray-700' },
  { key: 'MARKETING',   label: 'Marketing',   color: 'bg-pink-100 text-pink-700' },
  { key: 'OTHER',       label: 'Other',       color: 'bg-slate-100 text-slate-600' },
]

const KNOWN_KEYS = new Set(CATEGORIES.map((c) => c.key))

function catInfo(key: string): { key: string; label: string; color: string } {
  const found = CATEGORIES.find((c) => c.key === key)
  if (found) return found
  // Custom category — use Other style but display the actual name
  return { key, label: key, color: 'bg-slate-100 text-slate-600' }
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function thisMonth(expenses: GeneralExpense[]): number {
  const now = new Date()
  return expenses
    .filter((e) => {
      const d = new Date(e.paidAt)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    })
    .reduce((s, e) => s + parseFloat(e.amount), 0)
}

export default function ExpensesPage() {
  const [expenses,  setExpenses]  = useState<GeneralExpense[]>([])
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState<TabFilter>('all')
  const [modal,     setModal]     = useState(false)
  const [editing,   setEditing]   = useState<GeneralExpense | null>(null)
  const [saving,    setSaving]    = useState(false)

  // Form
  const [name,           setName]           = useState('')
  const [category,       setCategory]       = useState('OTHER')
  const [customCategory, setCustomCategory] = useState('')
  const [amount,         setAmount]         = useState('')
  const [isRecurring,    setIsRecurring]    = useState(false)
  const [recurDay,       setRecurDay]       = useState('1')
  const [paidAt,         setPaidAt]         = useState('')
  const [notes,          setNotes]          = useState('')

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/expenses')
      if (!res.ok) throw new Error()
      setExpenses(await res.json())
    } catch {
      toast.error('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  const openAdd = () => {
    setEditing(null)
    setName(''); setCategory('OTHER'); setCustomCategory(''); setAmount('')
    setIsRecurring(false); setRecurDay('1')
    setPaidAt(new Date().toISOString().slice(0, 10))
    setNotes('')
    setModal(true)
  }

  const openEdit = (e: GeneralExpense) => {
    setEditing(e)
    setName(e.name)
    if (KNOWN_KEYS.has(e.category)) {
      setCategory(e.category); setCustomCategory('')
    } else {
      setCategory('OTHER'); setCustomCategory(e.category)
    }
    setAmount(parseFloat(e.amount).toString())
    setIsRecurring(e.isRecurring)
    setRecurDay(e.recurDay ? String(e.recurDay) : '1')
    setPaidAt(e.paidAt.slice(0, 10))
    setNotes(e.notes ?? '')
    setModal(true)
  }

  const save = async () => {
    if (!name.trim())              { toast.error('Name is required');   return }
    if (!amount || parseFloat(amount) <= 0) { toast.error('Amount is required'); return }
    if (isRecurring && (!recurDay || parseInt(recurDay) < 1 || parseInt(recurDay) > 31)) {
      toast.error('Enter a valid day (1–31)'); return
    }
    setSaving(true)
    const resolvedCategory = category === 'OTHER' && customCategory.trim()
      ? customCategory.trim()
      : category

    const payload = {
      name: name.trim(), category: resolvedCategory, amount: parseFloat(amount),
      isRecurring, recurDay: isRecurring ? parseInt(recurDay) : null,
      paidAt: paidAt || new Date().toISOString(),
      notes: notes.trim() || null,
    }
    try {
      const url    = editing ? `/api/admin/expenses/${editing.id}` : '/api/admin/expenses'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      toast.success(editing ? 'Expense updated!' : 'Expense added!')
      setModal(false)
      fetchExpenses()
    } catch { toast.error('Failed to save.') }
    finally   { setSaving(false) }
  }

  const remove = async (e: GeneralExpense) => {
    if (!confirm(`Delete "${e.name}"?`)) return
    try {
      const res = await fetch(`/api/admin/expenses/${e.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setExpenses((prev) => prev.filter((x) => x.id !== e.id))
      toast.success('Expense deleted.')
    } catch { toast.error('Failed to delete.') }
  }

  // Stats
  const recurring    = expenses.filter((e) => e.isRecurring)
  const oneTime      = expenses.filter((e) => !e.isRecurring)
  const monthlyFixed = recurring.reduce((s, e) => s + parseFloat(e.amount), 0)
  const loggedMonth  = thisMonth(expenses)

  const filtered = expenses.filter((e) => {
    if (tab === 'recurring') return e.isRecurring
    if (tab === 'one-time')  return !e.isRecurring
    return true
  })

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-dark">Expenses</h1>
          <p className="text-gray-500 text-sm mt-1">
            {recurring.length} recurring · {oneTime.length} one-time
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary flex-shrink-0">
          <Plus size={16} /> Add Expense
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: RefreshCw,  label: 'Monthly Recurring', value: `$${fmt(monthlyFixed)}`, color: 'bg-blue-50 text-blue-600',   sub: `${recurring.length} fixed expense${recurring.length !== 1 ? 's' : ''}` },
          { icon: DollarSign, label: 'Logged This Month',  value: `$${fmt(loggedMonth)}`,  color: 'bg-amber-50 text-amber-600', sub: 'all expense entries' },
          { icon: Receipt,    label: 'Total Entries',      value: expenses.length.toString(), color: 'bg-purple-50 text-purple-600', sub: 'across all categories' },
        ].map(({ icon: Icon, label, value, color, sub }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 shadow-sm">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>
              <Icon size={14} />
            </div>
            <p className="text-base sm:text-lg font-black text-brand-dark leading-tight">{value}</p>
            <p className="text-gray-400 text-xs mt-0.5">{label}</p>
            <p className="text-gray-300 text-[10px]">{sub}</p>
          </div>
        ))}
      </div>

      {/* Tab filter */}
      <div className="flex items-center gap-2">
        {([
          { key: 'all',       label: 'All',       count: expenses.length },
          { key: 'recurring', label: 'Recurring',  count: recurring.length },
          { key: 'one-time',  label: 'One-time',   count: oneTime.length },
        ] as { key: TabFilter; label: string; count: number }[]).map(({ key, label, count }) => (
          <button key={key} type="button" onClick={() => setTab(key)}
            className={clsx('px-3 py-1.5 rounded-full text-sm font-semibold transition-all border',
              tab === key ? 'bg-brand-dark text-white border-brand-dark' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400')}>
            {label}
            <span className={clsx('ml-1.5 text-xs', tab === key ? 'text-gray-300' : 'text-gray-400')}>{count}</span>
          </button>
        ))}
      </div>

      {/* Expense list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <p className="px-6 py-12 text-center text-gray-400">Loading expenses...</p>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Receipt size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No expenses yet. Add one to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Expense', 'Category', 'Amount', 'Type', 'Date / Schedule', 'Notes', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((e) => {
                  const cat = catInfo(e.category)
                  return (
                    <tr key={e.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3 font-semibold text-brand-dark">{e.name}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('px-2 py-0.5 rounded text-[11px] font-bold', cat.color)}>{cat.label}</span>
                      </td>
                      <td className="px-4 py-3 font-bold text-brand-dark whitespace-nowrap">
                        ${fmt(parseFloat(e.amount))}
                        {e.isRecurring && <span className="text-gray-400 text-xs font-normal">/mo</span>}
                      </td>
                      <td className="px-4 py-3">
                        {e.isRecurring ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <RefreshCw size={9} /> Recurring
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-50 text-gray-600 border border-gray-200">
                            One-time
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {e.isRecurring && e.recurDay
                          ? <span className="font-semibold text-blue-600">Every month on the {ordinal(e.recurDay)}</span>
                          : new Date(e.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs max-w-[140px]">
                        <span className="truncate block">{e.notes || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(e)}
                            className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => remove(e)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-brand-red transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModal(false) }}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto">

            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-lg text-brand-dark">{editing ? 'Edit Expense' : 'Add Expense'}</h2>
              <button onClick={() => setModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={18} /></button>
            </div>

            <div className="p-5 space-y-4">

              {/* Name */}
              <div>
                <label className="admin-label">Expense Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  className="admin-input" placeholder="e.g. Monthly Rent, Hydro Bill, WD-40..." />
              </div>

              {/* Category */}
              <div>
                <label className="admin-label">Category</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {CATEGORIES.map((c) => (
                    <button key={c.key} type="button" onClick={() => setCategory(c.key)}
                      className={clsx('py-1.5 rounded-lg text-xs font-semibold border-2 transition-all',
                        category === c.key
                          ? `${c.color} border-current`
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300')}>
                      {c.label}
                    </button>
                  ))}
                </div>
                {category === 'OTHER' && (
                  <input
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="admin-input mt-2"
                    placeholder="Custom category name (e.g. Vehicle Maintenance, Software…)"
                  />
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="admin-label">Amount ($) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input value={amount} onChange={(e) => setAmount(e.target.value)}
                    className="admin-input pl-6 text-lg font-bold" placeholder="0.00" type="number" step="0.01" />
                </div>
              </div>

              {/* One-time vs Recurring */}
              <div>
                <label className="admin-label">Frequency</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { val: false, label: 'One-time',  sub: 'Single payment',          active: 'bg-brand-dark border-brand-dark text-white' },
                    { val: true,  label: 'Recurring',  sub: 'Repeats every month',    active: 'bg-blue-600 border-blue-600 text-white' },
                  ] as { val: boolean; label: string; sub: string; active: string }[]).map(({ val, label, sub, active }) => (
                    <button key={String(val)} type="button" onClick={() => setIsRecurring(val)}
                      className={clsx('flex flex-col items-center py-3 rounded-xl border-2 transition-all',
                        isRecurring === val ? active : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400')}>
                      <span className="font-bold text-sm">{label}</span>
                      <span className={clsx('text-[10px] mt-0.5', isRecurring === val ? 'opacity-75' : 'text-gray-400')}>{sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recurring: day of month */}
              {isRecurring && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <label className="admin-label text-blue-700 mb-2">Due on which day of the month?</label>
                  <div className="flex items-center gap-3">
                    <input value={recurDay} onChange={(e) => setRecurDay(e.target.value)}
                      className="admin-input w-20 text-center text-lg font-bold" type="number" min="1" max="31" placeholder="1" />
                    <p className="text-sm text-blue-600 font-medium">
                      {recurDay && parseInt(recurDay) >= 1 && parseInt(recurDay) <= 31
                        ? `Due every month on the ${ordinal(parseInt(recurDay))}`
                        : 'Enter a day 1–31'}
                    </p>
                  </div>
                </div>
              )}

              {/* Date (one-time only) */}
              {!isRecurring && (
                <div>
                  <label className="admin-label">Date Paid</label>
                  <input value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className="admin-input" type="date" />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="admin-label">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                <input value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="admin-input" placeholder="Any extra details…" />
              </div>

              <div className="flex gap-3 pt-1 pb-safe">
                <button type="button" onClick={() => setModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={save} disabled={saving}
                  className="flex-1 bg-brand-dark text-white rounded-xl py-3 text-sm font-bold hover:bg-black transition-colors disabled:opacity-60">
                  {saving ? 'Saving…' : editing ? 'Update Expense' : 'Add Expense'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
