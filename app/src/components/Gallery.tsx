'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Camera, X, ChevronLeft, ChevronRight } from 'lucide-react'

// ─── ADD YOUR PHOTOS HERE ───────────────────────────────────────────────────
// Drop photo files into  /app/public/gallery/
// Then add the filenames to this array below.
const photos: { src: string; alt: string }[] = [
  { src: '/gallery/p1.jpeg', alt: 'JC Central Tire Shop' },
  { src: '/gallery/p2.jpeg', alt: 'JC Central Tire Shop' },
  { src: '/gallery/p3.jpeg', alt: 'JC Central Tire Shop' },
  { src: '/gallery/p4.jpeg', alt: 'JC Central Tire Shop' },
  { src: '/gallery/p5.jpeg', alt: 'JC Central Tire Shop' },
  { src: '/gallery/p6.jpeg', alt: 'JC Central Tire Shop' },
  { src: '/gallery/p.jpeg', alt: 'JC Central Tire Shop' },
  { src: '/gallery/p8.jpeg', alt: 'JC Central Tire Shop' },
  { src: '/gallery/p9.jpeg', alt: 'JC Central Tire Shop' },
  { src: '/gallery/p10.jpeg', alt: 'JC Central Tire Shop' },
  { src: '/gallery/p11.jpeg', alt: 'JC Central Tire Shop' },
  { src: '/gallery/p12.jpeg', alt: 'JC Central Tire Shop' },
  { src: '/gallery/p13.jpeg', alt: 'JC Central Tire Shop' },
  { src: '/gallery/p14.jpeg', alt: 'JC Central Tire Shop' },
  { src: '/gallery/p15.jpeg', alt: 'JC Central Tire Shop' },
  { src: '/gallery/p16.jpeg', alt: 'JC Central Tire Shop' },
  { src: '/gallery/p17.jpeg', alt: 'JC Central Tire Shop' },
  { src: '/gallery/p18.png', alt: 'JC Central Tire Shop' },
  { src: '/gallery/p19.png', alt: 'JC Central Tire Shop' },
  { src: '/gallery/p20.png', alt: 'JC Central Tire Shop' },

]
// ─────────────────────────────────────────────────────────────────────────────

const placeholderCount = 8

function PlaceholderTile({ index }: { index: number }) {
  const colors = [
    'from-yellow-900/40 to-black',
    'from-red-900/40 to-black',
    'from-yellow-800/30 to-black',
    'from-zinc-800 to-black',
    'from-yellow-900/40 to-black',
    'from-red-900/40 to-black',
    'from-yellow-800/30 to-black',
    'from-zinc-800 to-black',
  ]
  return (
    <div
      className={`relative w-72 h-52 flex-shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br ${colors[index % colors.length]} border border-white/5 flex flex-col items-center justify-center gap-2`}
    >
      <Camera size={28} className="text-brand-yellow/40" />
      <p className="text-white/20 text-xs font-semibold uppercase tracking-widest">Shop Photo</p>
    </div>
  )
}

function GalleryTile({ src, alt, onClick }: { src: string; alt: string; onClick: () => void }) {
  const [error, setError] = useState(false)
  if (error) return <PlaceholderTile index={0} />
  return (
    <div
      className="relative w-72 h-52 flex-shrink-0 rounded-2xl overflow-hidden cursor-zoom-in group"
      onClick={onClick}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover object-bottom scale-125 group-hover:scale-[1.35] transition-transform duration-700"
        onError={() => setError(true)}
      />
      {/* zoom hint overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full tracking-wide">
          Tap to zoom
        </span>
      </div>
    </div>
  )
}

// ─── Lightbox ────────────────────────────────────────────────────────────────
function Lightbox({ photos, index, onClose }: { photos: { src: string; alt: string }[]; index: number; onClose: () => void }) {
  const [current, setCurrent] = useState(index)
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const prev = () => { setCurrent((c) => (c - 1 + photos.length) % photos.length); resetZoom() }
  const next = () => { setCurrent((c) => (c + 1) % photos.length); resetZoom() }
  
  const resetZoom = () => {
    setZoom(1)
    setPanX(0)
    setPanY(0)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom((z) => Math.max(1, Math.min(5, z * delta)))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanX(e.clientX - dragStart.x)
      setPanY(e.clientY - dragStart.y)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center overflow-hidden"
      onClick={onClose}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Close */}
      <button
        type="button"
        aria-label="Close"
        className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors z-10"
        onClick={onClose}
      >
        <X size={24} />
      </button>

      {/* Prev */}
      {photos.length > 1 && (
        <button
          type="button"
          aria-label="Previous photo"
          className="absolute left-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors z-10"
          onClick={(e) => { e.stopPropagation(); prev() }}
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {/* Image Container */}
      <div
        className="relative w-full max-w-5xl max-h-[90vh] mx-12 aspect-video overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
      >
        <div
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
            transformOrigin: 'center',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            cursor: zoom > 1 ? 'grab' : 'zoom-in',
          }}
          className="w-full h-full"
        >
          <Image
            src={photos[current].src}
            alt={photos[current].alt}
            fill
            className="object-contain"
            sizes="100vw"
            draggable={false}
          />
        </div>
        {zoom > 1 && (
          <div className="absolute bottom-4 left-4 bg-black/60 text-white text-xs px-3 py-1 rounded">
            Scroll to zoom • Drag to pan
          </div>
        )}
      </div>

      {/* Next */}
      {photos.length > 1 && (
        <button
          type="button"
          aria-label="Next photo"
          className="absolute right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors z-10"
          onClick={(e) => { e.stopPropagation(); next() }}
        >
          <ChevronRight size={28} />
        </button>
      )}

      {/* Counter */}
      <p className="absolute bottom-4 text-white/50 text-sm">
        {current + 1} / {photos.length}
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

const items = photos.length > 0 ? photos : Array.from({ length: placeholderCount }, (_, i) => ({ src: '', alt: '', index: i }))

export default function Gallery() {
  const doubled = [...items, ...items]
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  return (
    <section className="py-20 bg-brand-dark overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="flex items-end justify-between">
          <div>
            <span className="section-tag-dark">Our Work</span>
            <h2 className="text-3xl font-black text-white mt-2 tracking-tight">Check Out Our Wheels</h2>
          </div>
          <p className="text-gray-500 text-sm hidden sm:block">Kent, Washington</p>
        </div>
      </div>

      {/* Marquee track */}
      <div className="flex gap-4 w-max animate-marquee hover:[animation-play-state:paused] pl-4">
        {doubled.map((item, i) =>
          'src' in item && item.src ? (
            <GalleryTile
              key={i}
              src={item.src}
              alt={item.alt}
              onClick={() => setLightboxIndex(i % photos.length)}
            />
          ) : (
            <PlaceholderTile key={i} index={i % placeholderCount} />
          )
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </section>
  )
}
