'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle2, XCircle, RefreshCw, ChevronLeft, ChevronRight,
  ArrowDownCircle, ArrowUpCircle, Eye,
} from 'lucide-react'
import { clsx } from 'clsx'
import Link from 'next/link'

type ScanType = 'RECEIVE' | 'REMOVE' | 'AUDIT'

interface ScanLogEntry {
  id: string
  scannedValue: string
  scanType: ScanType
  userEmail?: string | null
  qtyBefore?: number | null
  qtyAfter?: number | null
  success: boolean
  errorMessage?: string | null
  createdAt: string
  tire?: {
    brand: string
    model: string
    width: number
    aspect: number
    diameter: number
    sku?: string | null
  } | null
}

const SCAN_TYPE_STYLES: Record<ScanType, string> = {
  RECEIVE: 'bg-emerald-100 text-emerald-700',
  REMOVE:  'bg-red-100 text-red-700',
  AUDIT:   'bg-blue-100 text-blue-700',
}

const SCAN_TYPE_ICONS: Record<ScanType, React.ElementType> = {
  RECEIVE: ArrowDownCircle,
  REMOVE:  ArrowUpCircle,
  AUDIT:   Eye,
}

export default function ScanLogPage() {
  const [logs,     setLogs]     = useState<ScanLogEntry[]>([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(0)
  const [scanType, setScanType] = useState<ScanType | ''>('')
  const [success,  setSuccess]  = useState<'true' | 'false' | ''>('')
  const [from,     setFrom]     = useState('')
  const [to,       setTo]       = useState('')

  const limit = 50

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit:  String(limit),
        offset: String(page * limit),
      })
      if (scanType) params.set('scanType', scanType)
      if (success)  params.set('success', success)
      if (from)     params.set('from', from)
      if (to)       params.set('to', to)

      const res = await fetch(`/api/admin/scan-log?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLogs(data.logs)
      setTotal(data.total)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [page, scanType, success, from, to])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  // Reset page when filters change
  useEffect(() => { setPage(0) }, [scanType, success, from, to])

  const totalPages = Math.ceil(total / limit)

  const fmt = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-dark">Scan Log</h1>
          <p className="text-gray-500 text-sm mt-1">
            {total.toLocaleString()} total scan events
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/admin/scan"
            className="btn-primary text-sm px-4 py-2.5"
          >
            Scan Now
          </Link>
          <button
            type="button"
            onClick={fetchLogs}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-gray-400' : 'text-gray-500'} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="admin-label">Scan Type</label>
          <select
            value={scanType}
            onChange={(e) => setScanType(e.target.value as ScanType | '')}
            className="admin-select w-36"
          >
            <option value="">All types</option>
            <option value="RECEIVE">Receive</option>
            <option value="REMOVE">Remove</option>
            <option value="AUDIT">Audit</option>
          </select>
        </div>
        <div>
          <label className="admin-label">Result</label>
          <select
            value={success}
            onChange={(e) => setSuccess(e.target.value as 'true' | 'false' | '')}
            className="admin-select w-32"
          >
            <option value="">All</option>
            <option value="true">Success</option>
            <option value="false">Failed</option>
          </select>
        </div>
        <div>
          <label className="admin-label">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="admin-input w-40"
          />
        </div>
        <div>
          <label className="admin-label">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="admin-input w-40"
          />
        </div>
        {(scanType || success || from || to) && (
          <button
            type="button"
            onClick={() => { setScanType(''); setSuccess(''); setFrom(''); setTo('') }}
            className="text-sm text-gray-500 hover:text-brand-dark underline self-end pb-2.5"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Time', 'Tire', 'Scanned Value', 'Type', 'Qty', 'Result', 'User'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    Loading scan history...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <p className="text-gray-400 font-medium">No scan events found</p>
                    {!scanType && !success && !from && !to && (
                      <Link href="/admin/scan" className="mt-2 inline-block text-sm text-brand-red hover:underline">
                        Go scan something →
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const TypeIcon = SCAN_TYPE_ICONS[log.scanType]
                  const delta = (log.qtyAfter ?? 0) - (log.qtyBefore ?? 0)

                  return (
                    <tr key={log.id} className={clsx('transition-colors hover:bg-gray-50/60', !log.success && 'bg-red-50/20')}>

                      {/* Time */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-gray-500 font-mono">{fmt(log.createdAt)}</span>
                      </td>

                      {/* Tire */}
                      <td className="px-4 py-3">
                        {log.tire ? (
                          <div>
                            <p className="font-semibold text-brand-dark text-xs leading-tight">
                              {log.tire.brand} {log.tire.model}
                            </p>
                            <p className="text-gray-400 font-mono text-[11px]">
                              {log.tire.width}/{log.tire.aspect}R{log.tire.diameter}
                              {log.tire.sku && ` · ${log.tire.sku}`}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">Unknown</span>
                        )}
                      </td>

                      {/* Scanned value */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-600 break-all max-w-[120px] block">
                          {log.scannedValue}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        <span className={clsx(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold',
                          SCAN_TYPE_STYLES[log.scanType]
                        )}>
                          <TypeIcon size={10} />
                          {log.scanType}
                        </span>
                      </td>

                      {/* Qty */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {log.qtyBefore !== null && log.qtyBefore !== undefined ? (
                          <div className="text-xs">
                            <span className="text-gray-500">{log.qtyBefore}</span>
                            {log.scanType !== 'AUDIT' && (
                              <>
                                <span className="text-gray-300 mx-1">→</span>
                                <span className="font-bold text-brand-dark">{log.qtyAfter}</span>
                                {delta !== 0 && (
                                  <span className={clsx(
                                    'ml-1 font-semibold',
                                    delta > 0 ? 'text-emerald-600' : 'text-red-500'
                                  )}>
                                    ({delta > 0 ? '+' : ''}{delta})
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Result */}
                      <td className="px-4 py-3">
                        {log.success ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                            <CheckCircle2 size={12} /> OK
                          </span>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 text-red-500 text-xs font-semibold">
                              <XCircle size={12} /> Failed
                            </span>
                            {log.errorMessage && (
                              <p className="text-[10px] text-red-400 mt-0.5 max-w-[140px] leading-tight">
                                {log.errorMessage}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* User */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-400 truncate max-w-[120px] block">
                          {log.userEmail ?? '—'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Page {page + 1} of {totalPages} · {total.toLocaleString()} total
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
