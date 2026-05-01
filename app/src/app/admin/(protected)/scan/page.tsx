'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Camera, CameraOff, Scan, RotateCcw,
  CheckCircle2, XCircle, Loader2, ClipboardList, Minus, Plus,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import Link from 'next/link'

type ScanType = 'RECEIVE' | 'REMOVE' | 'AUDIT'

interface TireInfo {
  id: string
  brand: string
  model: string
  width: number
  aspect: number
  diameter: number
  sku?: string | null
  quantity: number
}

interface ScanResult {
  success: boolean
  tire?: TireInfo
  qtyBefore?: number
  qtyAfter?: number
  delta?: number
  error?: string
  scannedValue: string
  scanType: ScanType
  qty: number
  timestamp: Date
}

// Minimal BarcodeDetector types (not in standard TS lib)
interface BarcodeDetectorResult {
  rawValue: string
  format: string
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ScanPage() {
  const [scanType,    setScanType]    = useState<ScanType>('RECEIVE')
  const [qty,         setQty]         = useState(1)
  const [customQty,   setCustomQty]   = useState('')
  const [inputValue,  setInputValue]  = useState('')
  const [scanning,    setScanning]    = useState(false)
  const [cameraMode,  setCameraMode]  = useState(false)
  const [cameraOk,    setCameraOk]    = useState(false)   // BarcodeDetector available
  const [lastResult,  setLastResult]  = useState<ScanResult | null>(null)
  const [recentScans, setRecentScans] = useState<ScanResult[]>([])
  const [cooldown,    setCooldown]    = useState(false)

  const inputRef      = useRef<HTMLInputElement>(null)
  const videoRef      = useRef<HTMLVideoElement>(null)
  const streamRef     = useRef<MediaStream | null>(null)
  const detectorRef   = useRef<{ detect: (v: HTMLVideoElement) => Promise<BarcodeDetectorResult[]> } | null>(null)
  const scanningRef   = useRef(false)
  const cooldownRef   = useRef(false)
  const processRef    = useRef<(value: string) => Promise<void>>()

  // Check BarcodeDetector availability on client
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('BarcodeDetector' in window)) return

    setCameraOk(true)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const BD = (window as any).BarcodeDetector
    BD.getSupportedFormats()
      .then((fmts: string[]) => {
        detectorRef.current = new BD({ formats: fmts })
      })
      .catch(() => {
        detectorRef.current = new BD({
          formats: ['qr_code', 'code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_39', 'code_93'],
        })
      })
  }, [])

  // Focus input when camera closes
  useEffect(() => {
    if (!cameraMode) inputRef.current?.focus()
  }, [cameraMode])

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      scanningRef.current = false
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const activeQty = customQty ? parseInt(customQty) || 1 : qty

  const processScannedValue = useCallback(
    async (value: string) => {
      const trimmed = value.trim()
      if (!trimmed || scanning || cooldownRef.current) return

      setScanning(true)
      try {
        const res  = await fetch('/api/admin/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scannedValue: trimmed, scanType, qty: activeQty }),
        })
        const data = await res.json()

        const result: ScanResult = {
          success:      data.success,
          tire:         data.tire,
          qtyBefore:    data.qtyBefore,
          qtyAfter:     data.qtyAfter,
          delta:        data.delta,
          error:        data.error,
          scannedValue: trimmed,
          scanType,
          qty:          activeQty,
          timestamp:    new Date(),
        }

        setLastResult(result)
        setRecentScans((prev) => [result, ...prev].slice(0, 20))
        setInputValue('')

        // 1.5 s cooldown to prevent duplicate scans from fast scanners
        setCooldown(true)
        cooldownRef.current = true
        setTimeout(() => {
          setCooldown(false)
          cooldownRef.current = false
          if (!scanningRef.current) inputRef.current?.focus()
        }, 1500)
      } catch {
        toast.error('Network error — check connection')
      } finally {
        setScanning(false)
      }
    },
    [scanType, activeQty, scanning]
  )

  // Keep ref in sync so camera loop always uses latest version
  useEffect(() => {
    processRef.current = processScannedValue
  }, [processScannedValue])

  // Camera scan loop (runs while cameraMode is true)
  useEffect(() => {
    if (!cameraMode) return

    scanningRef.current = true
    let running = true

    const loop = async () => {
      if (!running || !videoRef.current || !detectorRef.current) return
      if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        try {
          const results = await detectorRef.current.detect(videoRef.current)
          if (results.length > 0 && !cooldownRef.current && processRef.current) {
            await processRef.current(results[0].rawValue)
          }
        } catch {
          // BarcodeDetector throws on some frames — ignore
        }
      }
      if (running) setTimeout(loop, 300)
    }

    loop()
    return () => { running = false; scanningRef.current = false }
  }, [cameraMode])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraMode(true)
    } catch {
      toast.error('Could not access camera — check browser permissions')
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraMode(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') processScannedValue(inputValue)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-dark">Scan Inventory</h1>
          <p className="text-gray-500 text-sm mt-1">
            Receive, remove, or audit stock by scanning a barcode or SKU
          </p>
        </div>
        <Link
          href="/admin/scan-log"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-dark transition-colors flex-shrink-0"
        >
          <ClipboardList size={15} />
          Scan Log
        </Link>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">

        {/* Scan type toggle */}
        <div>
          <label className="admin-label">What are you doing?</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { key: 'RECEIVE', label: 'Receive',  sub: 'Add to stock',   active: 'bg-emerald-500 border-emerald-500 text-white', ring: 'border-emerald-200 text-emerald-700 hover:border-emerald-400' },
              { key: 'REMOVE',  label: 'Remove',   sub: 'Take from stock', active: 'bg-red-500 border-red-500 text-white',         ring: 'border-red-200 text-red-700 hover:border-red-400' },
              { key: 'AUDIT',   label: 'Audit',    sub: 'Log only',        active: 'bg-blue-500 border-blue-500 text-white',        ring: 'border-blue-200 text-blue-700 hover:border-blue-400' },
            ] as { key: ScanType; label: string; sub: string; active: string; ring: string }[]).map(({ key, label, sub, active, ring }) => (
              <button
                key={key}
                type="button"
                onClick={() => setScanType(key)}
                className={clsx(
                  'flex flex-col items-center py-3 rounded-xl border-2 transition-all text-center',
                  scanType === key ? active : `bg-white ${ring}`
                )}
              >
                <span className="font-bold text-sm">{label}</span>
                <span className={clsx('text-[10px] mt-0.5', scanType === key ? 'opacity-80' : 'text-gray-400')}>
                  {sub}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        {scanType !== 'AUDIT' && (
          <div>
            <label className="admin-label">Quantity per scan</label>
            <div className="flex items-center gap-2">
              {[1, 2, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => { setQty(n); setCustomQty('') }}
                  className={clsx(
                    'w-12 h-10 rounded-lg border-2 font-bold text-sm transition-all',
                    qty === n && !customQty
                      ? 'bg-brand-dark text-white border-brand-dark'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  )}
                >
                  {n}
                </button>
              ))}
              <div className="relative flex items-center">
                <button
                  type="button"
                  onClick={() => setCustomQty((v) => String(Math.max(1, (parseInt(v) || 1) - 1)))}
                  className="absolute left-2 text-gray-400 hover:text-gray-700"
                >
                  <Minus size={12} />
                </button>
                <input
                  type="number"
                  min={1}
                  value={customQty}
                  onChange={(e) => { setCustomQty(e.target.value); setQty(0) }}
                  placeholder="other"
                  className="admin-input pl-7 pr-7 w-24 text-center text-sm"
                />
                <button
                  type="button"
                  onClick={() => setCustomQty((v) => String((parseInt(v) || 1) + 1))}
                  className="absolute right-2 text-gray-400 hover:text-gray-700"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scanner Area */}
      <div className="bg-brand-dark rounded-2xl p-5 space-y-4">

        {/* Camera viewfinder */}
        {cameraMode && (
          <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            {/* Targeting reticle */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-52 h-36 border-2 border-brand-yellow rounded-xl opacity-80" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4">
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-brand-yellow" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-brand-yellow" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-brand-yellow" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-brand-yellow" />
              </div>
            </div>
            <p className="absolute bottom-2 left-0 right-0 text-center text-white/60 text-xs">
              Hold barcode steady in the frame
            </p>
          </div>
        )}

        {/* Status + camera toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={clsx(
              'w-2 h-2 rounded-full transition-colors',
              scanning   ? 'bg-yellow-400 animate-pulse' :
              cooldown   ? 'bg-blue-400' :
              cameraMode ? 'bg-brand-yellow animate-pulse' :
                           'bg-green-400'
            )} />
            <span className="text-gray-400 text-xs font-medium">
              {scanning   ? 'Processing...' :
               cooldown   ? 'Ready in 1.5 s...' :
               cameraMode ? 'Camera scanning...' :
                            'Scanner ready'}
            </span>
          </div>

          {cameraOk ? (
            <button
              type="button"
              onClick={cameraMode ? stopCamera : startCamera}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                cameraMode
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              )}
            >
              {cameraMode ? <><CameraOff size={13} /> Stop Camera</> : <><Camera size={13} /> Use Camera</>}
            </button>
          ) : (
            <span className="text-gray-600 text-xs italic">Camera: use Chrome/Edge for QR scanning</span>
          )}
        </div>

        {/* Text input (always visible — works for USB/BT scanners) */}
        <div className="relative">
          <Scan size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={scanning || cooldown}
            placeholder={
              cameraMode
                ? 'Or type / scan manually here...'
                : 'Scan barcode with USB/BT scanner or type SKU · Enter to submit'
            }
            className={clsx(
              'w-full bg-brand-gray border rounded-xl pl-11 pr-16 py-4 text-white placeholder-gray-600',
              'text-base focus:outline-none focus:ring-2 transition-all',
              scanning || cooldown
                ? 'opacity-50 cursor-not-allowed border-white/5'
                : 'border-white/10 focus:ring-brand-yellow'
            )}
          />
          {scanning ? (
            <Loader2 size={17} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-yellow animate-spin" />
          ) : inputValue ? (
            <button
              type="button"
              disabled={cooldown}
              onClick={() => processScannedValue(inputValue)}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-brand-yellow text-black px-3 py-1.5 rounded-lg text-xs font-black hover:bg-yellow-400 disabled:opacity-40 transition-all"
            >
              Go
            </button>
          ) : null}
        </div>

        <p className="text-gray-600 text-[11px] text-center">
          USB / Bluetooth scanners work automatically — they type and hit Enter
        </p>
      </div>

      {/* Scan result */}
      {lastResult && (
        <div className={clsx(
          'rounded-2xl border-2 p-5 transition-all',
          lastResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
        )}>
          <div className="flex items-start gap-3">
            {lastResult.success
              ? <CheckCircle2 size={22} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              : <XCircle      size={22} className="text-red-500    flex-shrink-0 mt-0.5" />
            }

            <div className="flex-1 min-w-0">
              {lastResult.success && lastResult.tire ? (
                <>
                  <p className="font-black text-emerald-800 text-base leading-tight">
                    {lastResult.tire.brand} {lastResult.tire.model}
                  </p>
                  <p className="text-emerald-600 text-sm font-mono mt-0.5">
                    {lastResult.tire.width}/{lastResult.tire.aspect}R{lastResult.tire.diameter}
                    {lastResult.tire.sku && <span className="ml-2 text-emerald-500">· SKU: {lastResult.tire.sku}</span>}
                  </p>

                  {lastResult.scanType === 'AUDIT' ? (
                    <p className="text-emerald-700 text-sm mt-2 font-semibold">
                      Audit logged · Current stock: <span className="text-lg font-black">{lastResult.qtyBefore}</span>
                    </p>
                  ) : (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-emerald-600 text-sm">{lastResult.qtyBefore}</span>
                      <span className="text-emerald-400 text-sm">→</span>
                      <span className="text-emerald-800 text-xl font-black">{lastResult.qtyAfter}</span>
                      <span className={clsx(
                        'text-sm font-bold',
                        (lastResult.delta ?? 0) > 0 ? 'text-emerald-600' : 'text-red-500'
                      )}>
                        ({lastResult.delta! > 0 ? '+' : ''}{lastResult.delta})
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="font-bold text-red-700">Scan Failed</p>
                  <p className="text-red-600 text-sm mt-0.5">{lastResult.error}</p>
                  <p className="text-red-400 text-xs mt-1 font-mono break-all">
                    Scanned: {lastResult.scannedValue}
                  </p>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setLastResult(null)}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-1"
              aria-label="Dismiss result"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Recent scans this session */}
      {recentScans.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-600">This session</h3>
            <button
              type="button"
              onClick={() => setRecentScans([])}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
          </div>
          <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
            {recentScans.map((scan, i) => (
              <div key={i} className="px-4 py-2.5 flex items-center gap-3">
                <div className={clsx(
                  'w-1.5 h-1.5 rounded-full flex-shrink-0',
                  scan.success ? 'bg-emerald-400' : 'bg-red-400'
                )} />
                <div className="flex-1 min-w-0">
                  {scan.success && scan.tire ? (
                    <p className="text-sm font-medium text-brand-dark truncate">
                      {scan.tire.brand} {scan.tire.model}
                      <span className="text-gray-400 font-mono ml-1 text-xs">
                        {scan.tire.width}/{scan.tire.aspect}R{scan.tire.diameter}
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-red-500 truncate">{scan.error ?? 'Failed'}</p>
                  )}
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {scan.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    {scan.success && scan.qtyAfter !== undefined && ` · Qty: ${scan.qtyAfter}`}
                    {scan.qty > 1 && ` (×${scan.qty})`}
                  </p>
                </div>
                <span className={clsx(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0',
                  scan.scanType === 'RECEIVE' ? 'bg-emerald-100 text-emerald-700' :
                  scan.scanType === 'REMOVE'  ? 'bg-red-100 text-red-700' :
                                                'bg-blue-100 text-blue-700'
                )}>
                  {scan.scanType}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
