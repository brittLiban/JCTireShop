'use client'

import { useEffect, useRef } from 'react'

export function BarFill({
  pct,
  className,
  vertical = false,
}: {
  pct: number
  className: string
  vertical?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    if (vertical) {
      ref.current.style.height = `${pct}%`
    } else {
      ref.current.style.width = `${pct}%`
    }
  }, [pct, vertical])
  return <div ref={ref} className={className} />
}
