'use client'

import { useEffect, useRef } from 'react'

export function BarFill({ pct, className }: { pct: number; className: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.style.width = `${pct}%`
  }, [pct])
  return <div ref={ref} className={className} />
}
