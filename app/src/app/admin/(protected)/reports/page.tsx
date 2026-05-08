'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { TrendingDown, DollarSign, BarChart2, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const ReportCharts = dynamic(() => import('./ReportCharts'), {
  ssr: false,
  loading: () => (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 h-80 bg-gray-50 rounded-2xl animate-pulse border border-gray-100" />
      <div className="lg:col-span-2 h-80 bg-gray-50 rounded-2xl animate-pulse border border-gray-100" />
    </div>
  ),
})

type Preset = 'month' | '3months' | '6months' | 'year' | 'lastyear' | 'custom'

interface ReportData {
  total: number
  byCategory: { label: string; amount: number; color: string }[]
  byMonth:    { month: string; inventory: number; payroll: number; staffExp: number; overhead: number; total: number }[]
}

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'month',    label: 'This Month' },
  { key: '3months',  label: 'Last 3 Mo'  },
  { key: '6months',  label: 'Last 6 Mo'  },
  { key: 'year',     label: 'This Year'  },
  { key: 'lastyear', label: 'Last Year'  },
  { key: 'custom',   label: 'Custom'     },
]

function presetDates(preset: Preset): { from: string; to: string } {
  const now  = new Date()
  const pad  = (n: number) => String(n).padStart(2, '0')
  const fmt  = (d: Date)   => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const today = fmt(now)

  if (preset === 'month') {
    return { from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, to: today }
  }
  if (preset === '3months') {
    const d = new Date(now); d.setMonth(d.getMonth() - 2); d.setDate(1)
    return { from: fmt(d), to: today }
  }
  if (preset === '6months') {
    const d = new Date(now); d.setMonth(d.getMonth() - 5); d.setDate(1)
    return { from: fmt(d), to: today }
  }
  if (preset === 'year') {
    return { from: `${now.getFullYear()}-01-01`, to: today }
  }
  if (preset === 'lastyear') {
    const y = now.getFullYear() - 1
    return { from: `${y}-01-01`, to: `${y}-12-31` }
  }
  return { from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, to: today }
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function ReportsPage() {
  const [preset,  setPreset]  = useState<Preset>('year')
  const [from,    setFrom]    = useState('')
  const [to,      setTo]      = useState('')
  const [data,    setData]    = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchReport = useCallback(async (f: string, t: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reports?from=${f}&to=${t}`)
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch {
      toast.error('Failed to load report')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (preset === 'custom') return
    const { from: f, to: t } = presetDates(preset)
    setFrom(f); setTo(t)
    fetchReport(f, t)
  }, [preset, fetchReport])

  const applyCustom = () => {
    if (!from || !to) { toast.error('Pick a start and end date'); return }
    fetchReport(from, to)
  }

  const topCategory = data
    ? [...data.byCategory].sort((a, b) => b.amount - a.amount)[0]
    : null

  const avgMonthly = data && data.byMonth.length > 0
    ? data.total / data.byMonth.length
    : 0

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-brand-dark">Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Money out — where it goes and when</p>
      </div>

      {/* Range picker */}
      <div className="bg-brand-dark rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={13} className="text-gray-500" />
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Date Range</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(({ key, label }) => (
            <button key={key} type="button" onClick={() => setPreset(key)}
              className={clsx('px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                preset === key
                  ? 'bg-brand-yellow text-brand-dark border-brand-yellow'
                  : 'bg-transparent border-white/20 text-gray-400 hover:border-white/50 hover:text-white')}>
              {label}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-white/10">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-yellow" />
            <span className="text-gray-500 text-sm">→</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-yellow" />
            <button onClick={applyCustom}
              className="px-4 py-1.5 bg-brand-yellow text-brand-dark rounded-lg text-xs font-bold hover:opacity-90 transition-opacity">
              Apply
            </button>
          </div>
        )}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            icon: TrendingDown, label: 'Total Out', color: 'bg-red-50 text-red-600',
            value: data ? `$${fmt(data.total)}` : '—',
          },
          {
            icon: BarChart2, label: 'Avg / Month', color: 'bg-purple-50 text-purple-600',
            value: data ? `$${fmt(avgMonthly)}` : '—',
          },
          {
            icon: DollarSign, label: 'Biggest Category', color: 'bg-amber-50 text-amber-600',
            value: topCategory?.label ?? '—',
          },
          {
            icon: Calendar, label: 'Months Covered', color: 'bg-blue-50 text-blue-600',
            value: data ? String(data.byMonth.length) : '—',
          },
        ].map(({ icon: Icon, label, color, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 shadow-sm">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>
              <Icon size={14} />
            </div>
            <p className="text-base sm:text-lg font-black text-brand-dark leading-tight truncate">{value}</p>
            <p className="text-gray-400 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      {loading ? (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 h-80 bg-gray-50 rounded-2xl animate-pulse border border-gray-100" />
          <div className="lg:col-span-2 h-80 bg-gray-50 rounded-2xl animate-pulse border border-gray-100" />
        </div>
      ) : data ? (
        <ReportCharts byMonth={data.byMonth} byCategory={data.byCategory} />
      ) : null}

      {/* Breakdown table */}
      {data && data.byCategory.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-brand-dark">Full Breakdown</h3>
            <p className="text-xs text-gray-400">{from && to ? `${from} → ${to}` : ''}</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Category', 'Amount', '% of Total', 'Bar'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[...data.byCategory]
                .sort((a, b) => b.amount - a.amount)
                .map((cat) => {
                  const pct = data.total > 0 ? (cat.amount / data.total) * 100 : 0
                  return (
                    <tr key={cat.label} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                          <span className="font-medium text-brand-dark">{cat.label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-bold text-brand-dark whitespace-nowrap">
                        ${fmt(cat.amount)}
                      </td>
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                        {pct.toFixed(1)}%
                      </td>
                      <td className="px-5 py-3 w-48">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct.toFixed(0)}%`, background: cat.color }}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              {/* Total row */}
              <tr className="bg-gray-50 font-bold">
                <td className="px-5 py-3 text-brand-dark">Total</td>
                <td className="px-5 py-3 text-brand-dark">${fmt(data.total)}</td>
                <td className="px-5 py-3 text-gray-500">100%</td>
                <td className="px-5 py-3" />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {data && data.byCategory.length === 0 && !loading && (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <BarChart2 size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No expenses recorded for this date range.</p>
        </div>
      )}
    </div>
  )
}
