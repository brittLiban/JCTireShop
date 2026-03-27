'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Camera } from 'lucide-react'

// ─── ADD YOUR PHOTOS HERE ───────────────────────────────────────────────────
// Drop photo files into  /app/public/gallery/
// Then add the filenames to this array below.
// Example: '/gallery/my-shop.jpg'
const photos: { src: string; alt: string }[] = [
  { src: '/gallery/p1.jpeg', alt: 'JC Central Tire Shop' },
  { src: '/gallery/p2.jpeg', alt: 'JC Central Tire Shop' },
  { src: '/gallery/p3.jpeg', alt: 'JC Central Tire Shop' },
  { src: '/gallery/p4.jpeg', alt: 'JC Central Tire Shop' },
  { src: '/gallery/p5.jpeg', alt: 'JC Central Tire Shop' },
  { src: '/gallery/p6.jpeg', alt: 'JC Central Tire Shop' },
]
// ─────────────────────────────────────────────────────────────────────────────

// Placeholder tiles shown until real photos are added
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

function GalleryTile({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false)
  if (error) return <PlaceholderTile index={0} />
  return (
    <div className="relative w-72 h-52 flex-shrink-0 rounded-2xl overflow-hidden">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover object-bottom scale-125 hover:scale-[1.35] transition-transform duration-700"
        onError={() => setError(true)}
      />
    </div>
  )
}

const items = photos.length > 0 ? photos : Array.from({ length: placeholderCount }, (_, i) => ({ src: '', alt: '', index: i }))

export default function Gallery() {
  // Double the array for seamless infinite scroll
  const doubled = [...items, ...items]

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
            <GalleryTile key={i} src={item.src} alt={item.alt} />
          ) : (
            <PlaceholderTile key={i} index={i % placeholderCount} />
          )
        )}
      </div>

    </section>
  )
}
