'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Upload, ArrowRight, ArrowLeft, CheckCircle2, XCircle,
  FileSpreadsheet, RotateCcw, AlertTriangle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

type ImportType = 'tires' | 'orders'
type Step = 1 | 2 | 3

interface PreviewData {
  fileName:  string
  columns:   string[]
  preview:   Record<string, unknown>[]
  totalRows: number
  allRows:   Record<string, unknown>[]
}

interface ImportResult {
  rowsProcessed: number
  rowsSuccess:   number
  rowsError:     number
  errors:        Array<{ row: number; error: string }>
}

// ── Field definitions per import type ────────────────────────────────────────

const TIRE_FIELDS = [
  { value: '__skip__',   label: '— Skip this column —' },
  { value: 'brand',      label: 'Brand' },
  { value: 'model',      label: 'Model' },
  { value: 'sku',        label: 'SKU / Barcode' },
  { value: 'width',      label: 'Width (mm)' },
  { value: 'aspect',     label: 'Aspect Ratio' },
  { value: 'diameter',   label: 'Diameter (in)' },
  { value: 'quantity',   label: 'Quantity' },
  { value: 'cost',       label: 'Cost ($)' },
  { value: 'price',      label: 'Sell Price ($)' },
  { value: 'location',   label: 'Location' },
  { value: 'notes',      label: 'Notes' },
]

const ORDER_FIELDS = [
  { value: '__skip__',     label: '— Skip this column —' },
  { value: 'supplier',     label: 'Supplier Name' },
  { value: 'orderNumber',  label: 'Order Number' },
  { value: 'totalCost',    label: 'Total Cost ($)' },
  { value: 'status',       label: 'Status' },
  { value: 'orderedAt',    label: 'Order Date' },
  { value: 'expectedAt',   label: 'Expected Delivery Date' },
  { value: 'notes',        label: 'Notes' },
]

// Auto-detect a reasonable mapping from column names
function autoDetect(columns: string[], importType: ImportType): Record<string, string> {
  const mapping: Record<string, string> = {}
  const validFields = (importType === 'tires' ? TIRE_FIELDS : ORDER_FIELDS).map((f) => f.value)

  for (const col of columns) {
    const lc = col.toLowerCase().replace(/[^a-z0-9]/g, '')
    let match = '__skip__'

    if (importType === 'tires') {
      if (lc.includes('brand'))                              match = 'brand'
      else if (lc.includes('model'))                         match = 'model'
      else if (lc.includes('sku') || lc.includes('upc') || lc.includes('barcode')) match = 'sku'
      else if (lc.includes('width') || lc === 'w')          match = 'width'
      else if (lc.includes('aspect') || lc.includes('ratio')) match = 'aspect'
      else if (lc.includes('dia'))                           match = 'diameter'
      else if (lc.includes('qty') || lc.includes('quantity') || lc.includes('stock')) match = 'quantity'
      else if (lc.includes('cost') || lc.includes('wholesale')) match = 'cost'
      else if (lc.includes('price') || lc.includes('sell') || lc.includes('retail')) match = 'price'
      else if (lc.includes('loc') || lc.includes('bin') || lc.includes('shelf')) match = 'location'
      else if (lc.includes('note') || lc.includes('desc'))  match = 'notes'
    } else {
      if (lc.includes('supplier') || lc.includes('vendor')) match = 'supplier'
      else if (lc.includes('ordernumber') || lc.includes('po')) match = 'orderNumber'
      else if (lc.includes('total') || lc.includes('amount')) match = 'totalCost'
      else if (lc.includes('status'))                        match = 'status'
      else if (lc.includes('orderdate') || lc === 'ordered') match = 'orderedAt'
      else if (lc.includes('expected') || lc.includes('delivery')) match = 'expectedAt'
      else if (lc.includes('note'))                          match = 'notes'
    }

    mapping[col] = validFields.includes(match) ? match : '__skip__'
  }
  return mapping
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ImportPage() {
  const [step,          setStep]          = useState<Step>(1)
  const [importType,    setImportType]    = useState<ImportType>('tires')
  const [file,          setFile]          = useState<File | null>(null)
  const [dragging,      setDragging]      = useState(false)
  const [parsing,       setParsing]       = useState(false)
  const [preview,       setPreview]       = useState<PreviewData | null>(null)
  const [mapping,       setMapping]       = useState<Record<string, string>>({})
  const [importing,     setImporting]     = useState(false)
  const [result,        setResult]        = useState<ImportResult | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Step 1: File selection ─────────────────────────────────────────────────

  const handleFile = useCallback((f: File) => {
    if (!f.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('Only .xlsx and .xls files are supported')
      return
    }
    setFile(f)
    setPreview(null)
    setResult(null)
    setStep(1)
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const parseFile = async () => {
    if (!file) return
    setParsing(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/import/preview', { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Parse failed')
      }
      const data: PreviewData = await res.json()
      setPreview(data)
      setMapping(autoDetect(data.columns, importType))
      setStep(2)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to parse file')
    } finally {
      setParsing(false)
    }
  }

  // ── Step 2: Column mapping ─────────────────────────────────────────────────

  const fields = importType === 'tires' ? TIRE_FIELDS : ORDER_FIELDS

  const mappedCount = Object.values(mapping).filter((v) => v !== '__skip__').length

  // Check for duplicate field mappings
  const usedFields = Object.values(mapping).filter((v) => v !== '__skip__')
  const duplicates = usedFields.filter((v, i) => usedFields.indexOf(v) !== i)

  // ── Step 3: Execute import ──────────────────────────────────────────────────

  const executeImport = async () => {
    if (!preview) return
    setImporting(true)
    try {
      const res = await fetch('/api/admin/import/execute', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          fileName:      preview.fileName,
          importType,
          columnMapping: mapping,
          rows:          preview.allRows,
        }),
      })
      if (!res.ok) throw new Error('Import failed')
      const data = await res.json()
      setResult(data)
      setStep(3)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const reset = () => {
    setStep(1)
    setFile(null)
    setPreview(null)
    setMapping({})
    setResult(null)
    setImportType('tires')
  }

  // ── Preview table: apply mapping to show what will be imported ─────────────

  const mappedFields = Object.entries(mapping)
    .filter(([, v]) => v !== '__skip__')
    .map(([col, field]) => ({ col, field, label: fields.find((f) => f.value === field)?.label ?? field }))

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-brand-dark">Excel Import</h1>
        <p className="text-gray-500 text-sm mt-1">
          Upload a spreadsheet and map your columns to import tires or supplier orders
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {([
          { n: 1, label: 'Upload' },
          { n: 2, label: 'Map Columns' },
          { n: 3, label: 'Done' },
        ] as { n: Step; label: string }[]).map(({ n, label }, i) => (
          <div key={n} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-px bg-gray-200" />}
            <div className="flex items-center gap-1.5">
              <div className={clsx(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                step === n ? 'bg-brand-dark text-white' :
                step > n  ? 'bg-emerald-500 text-white' :
                            'bg-gray-100 text-gray-400'
              )}>
                {step > n ? <CheckCircle2 size={14} /> : n}
              </div>
              <span className={clsx(
                'text-sm font-medium',
                step === n ? 'text-brand-dark' : 'text-gray-400'
              )}>
                {label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── STEP 1: Upload ──────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Import type selector */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <label className="admin-label">What are you importing?</label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              {([
                { key: 'tires',  label: 'Tire Inventory', sub: 'Brand, model, size, qty, cost, price, SKU' },
                { key: 'orders', label: 'Supplier Orders', sub: 'Vendor, order #, total, status, dates' },
              ] as { key: ImportType; label: string; sub: string }[]).map(({ key, label, sub }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setImportType(key)}
                  className={clsx(
                    'text-left p-4 rounded-xl border-2 transition-all',
                    importType === key
                      ? 'bg-brand-dark border-brand-dark text-white'
                      : 'bg-white border-gray-200 hover:border-gray-400'
                  )}
                >
                  <p className="font-bold text-sm">{label}</p>
                  <p className={clsx('text-xs mt-0.5', importType === key ? 'text-gray-300' : 'text-gray-400')}>
                    {sub}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={clsx(
              'relative bg-white rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all',
              dragging ? 'border-brand-yellow bg-yellow-50' : 'border-gray-200 hover:border-gray-400'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            <FileSpreadsheet size={36} className={clsx('mx-auto mb-3', dragging ? 'text-brand-yellow' : 'text-gray-300')} />
            {file ? (
              <>
                <p className="font-bold text-brand-dark">{file.name}</p>
                <p className="text-gray-400 text-sm mt-1">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-gray-600">Drop your .xlsx file here</p>
                <p className="text-gray-400 text-sm mt-1">or click to browse · Excel 2007+ (.xlsx) supported</p>
              </>
            )}
          </div>

          {file && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={parseFile}
                disabled={parsing}
                className="btn-primary"
              >
                {parsing ? 'Parsing...' : 'Parse File'}
                {!parsing && <ArrowRight size={16} />}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: Map Columns ────────────────────────────────────────────── */}
      {step === 2 && preview && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              <span className="font-semibold text-brand-dark">{preview.fileName}</span>
              {' '}· {preview.totalRows} data rows · {preview.columns.length} columns
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-dark"
            >
              <ArrowLeft size={14} /> Back
            </button>
          </div>

          {/* Column mapping table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="font-semibold text-brand-dark text-sm">Map columns to fields</p>
              <p className="text-gray-400 text-xs mt-0.5">
                {mappedCount} of {preview.columns.length} columns mapped · Set unused columns to &ldquo;Skip&rdquo;
              </p>
              {duplicates.length > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-amber-600 text-xs">
                  <AlertTriangle size={13} />
                  Duplicate mapping: {Array.from(new Set(duplicates)).map((d) =>
                    fields.find((f) => f.value === d)?.label
                  ).join(', ')} — only the last will be used
                </div>
              )}
            </div>

            <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
              {preview.columns.map((col) => {
                const sample = preview.preview[0]?.[col]
                return (
                  <div key={col} className="px-5 py-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-brand-dark truncate">{col}</p>
                      {sample !== undefined && sample !== '' && (
                        <p className="text-xs text-gray-400 font-mono truncate mt-0.5">
                          e.g. {String(sample)}
                        </p>
                      )}
                    </div>
                    <ArrowRight size={14} className="text-gray-300 flex-shrink-0" />
                    <select
                      value={mapping[col] ?? '__skip__'}
                      onChange={(e) => setMapping((prev) => ({ ...prev, [col]: e.target.value }))}
                      className={clsx(
                        'admin-select w-52 flex-shrink-0 text-xs',
                        mapping[col] && mapping[col] !== '__skip__' ? 'border-emerald-300 bg-emerald-50' : ''
                      )}
                    >
                      {fields.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Preview table */}
          {mappedFields.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="font-semibold text-brand-dark text-sm">
                  Preview (first {Math.min(10, preview.preview.length)} of {preview.totalRows} rows)
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-400 font-semibold">#</th>
                      {mappedFields.map(({ field, label }) => (
                        <th key={field} className="px-3 py-2 text-left text-gray-500 font-semibold whitespace-nowrap">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {preview.preview.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2 text-gray-300 font-mono">{i + 2}</td>
                        {mappedFields.map(({ col, field }) => (
                          <td key={field} className="px-3 py-2 text-gray-600 max-w-[160px]">
                            <span className="truncate block">
                              {row[col] !== undefined && row[col] !== '' ? String(row[col]) : '—'}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <button
              type="button"
              onClick={executeImport}
              disabled={importing || mappedCount === 0}
              className="btn-primary"
            >
              {importing
                ? 'Importing...'
                : `Import ${preview.totalRows.toLocaleString()} rows`}
              {!importing && <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Results ────────────────────────────────────────────────── */}
      {step === 3 && result && (
        <div className="space-y-5">
          {/* Summary */}
          <div className={clsx(
            'rounded-2xl border-2 p-6',
            result.rowsError === 0
              ? 'bg-emerald-50 border-emerald-200'
              : result.rowsSuccess === 0
                ? 'bg-red-50 border-red-200'
                : 'bg-amber-50 border-amber-200'
          )}>
            <div className="flex items-center gap-3 mb-4">
              {result.rowsError === 0
                ? <CheckCircle2 size={24} className="text-emerald-600" />
                : result.rowsSuccess === 0
                  ? <XCircle size={24} className="text-red-500" />
                  : <AlertTriangle size={24} className="text-amber-600" />
              }
              <div>
                <p className="font-bold text-brand-dark text-lg">
                  {result.rowsError === 0
                    ? 'Import complete!'
                    : result.rowsSuccess === 0
                      ? 'Import failed'
                      : 'Partial import'}
                </p>
                <p className="text-gray-500 text-sm">
                  {preview?.fileName} · {importType === 'tires' ? 'Tires' : 'Supplier Orders'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <p className="text-2xl font-black text-brand-dark">{result.rowsProcessed}</p>
                <p className="text-xs text-gray-400 mt-0.5">Total rows</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <p className="text-2xl font-black text-emerald-600">{result.rowsSuccess}</p>
                <p className="text-xs text-gray-400 mt-0.5">Imported</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <p className="text-2xl font-black text-red-500">{result.rowsError}</p>
                <p className="text-xs text-gray-400 mt-0.5">Failed</p>
              </div>
            </div>
          </div>

          {/* Error list */}
          {result.errors.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="font-semibold text-brand-dark text-sm flex items-center gap-2">
                  <XCircle size={15} className="text-red-500" />
                  Failed rows ({result.errors.length})
                </p>
              </div>
              <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                {result.errors.map(({ row, error }) => (
                  <div key={row} className="px-5 py-2.5 flex items-start gap-3">
                    <span className="text-xs font-mono text-gray-400 flex-shrink-0 mt-0.5">Row {row}</span>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button type="button" onClick={reset} className="flex items-center gap-2 btn-primary">
              <RotateCcw size={15} />
              Import Another File
            </button>
            {importType === 'tires' ? (
              <a
                href="/admin/inventory"
                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                View Inventory →
              </a>
            ) : (
              <a
                href="/admin/orders"
                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                View Orders →
              </a>
            )}
          </div>
        </div>
      )}

      {/* Past imports note */}
      <div className="text-xs text-gray-400 border-t border-gray-100 pt-4">
        Import history is saved to the database. Duplicate tires (same SKU or brand/model/size) are updated, not duplicated.
        Duplicate orders are always inserted as new records.
      </div>
    </div>
  )
}
