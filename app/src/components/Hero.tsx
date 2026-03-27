'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { ArrowRight, Shield, Clock, Wrench, MapPin } from 'lucide-react'
import Image from 'next/image'
import { useLanguage } from '@/contexts/LanguageContext'
import { translations } from '@/lib/translations'

// ── Drop hero background photos in /public/bg/ ──────────────────
// These are SEPARATE from the rolling gallery (public/gallery/)
const bgPhotos = [
  '/bg/bg1.jpeg',
  // '/bg/bg2.jpeg',
  // '/bg/bg3.jpeg',
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const badgeIcons = [Shield, Clock, Wrench]

export default function Hero() {
  const { lang } = useLanguage()
  const t = translations[lang].hero
  const [bgIndex, setBgIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setBgIndex((i) => (i + 1) % bgPhotos.length)
    }, 4000)
    return () => clearInterval(id)
  }, [])

  const scrollTo = (id: string) =>
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })

  const badgeKeys = ['licensed', 'sameDay', 'expert'] as const

  return (
    <section className="relative min-h-screen flex items-center bg-brand-dark overflow-hidden pt-[4.5rem]">

      {/* ── Background slideshow ───────────────────────────────────── */}
      {bgPhotos.map((src, i) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === bgIndex ? 'opacity-55' : 'opacity-0'}`}
        >
          <Image src={src} alt="" fill className="object-cover object-top" priority={i === 0} />
        </div>
      ))}

      {/* Dark overlay — keep text legible */}
      <div className="absolute inset-0 bg-brand-dark/55" />

      {/* Dot grid */}
      <div className="dot-grid absolute inset-0 opacity-[0.035]" />

      {/* Glow blob */}
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-brand-yellow/5 rounded-full blur-3xl pointer-events-none" />

      {/* Vertical text label — left edge, desktop only */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-center gap-3 pointer-events-none">
        <div className="w-px h-16 bg-gradient-to-b from-transparent to-gray-700" />
        <span className="writing-mode-vertical text-gray-700 text-[10px] tracking-[0.2em] uppercase font-medium">
          JC Central Tire Shop
        </span>
        <div className="w-px h-16 bg-gradient-to-t from-transparent to-gray-700" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">

        {/* Two-column layout on desktop */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">

          {/* LEFT — text content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex-1 min-w-0"
          >
            {/* Tag */}
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center gap-2 bg-brand-yellow/10 border border-brand-yellow/30 text-brand-yellow px-4 py-1.5 rounded-full text-sm font-semibold">
                <span className="w-1.5 h-1.5 bg-brand-yellow rounded-full animate-pulse" />
                {t.tag}
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="mt-6 text-5xl sm:text-6xl md:text-7xl lg:text-[5rem] font-black text-white leading-[1.02] tracking-tight"
            >
              {t.headline1}{' '}
              <span className="relative inline-block text-brand-yellow">
                {t.headline2}
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 200 8"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 6 Q50 2 100 5 Q150 8 200 4"
                    stroke="#FFD600"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    opacity="0.6"
                  />
                </svg>
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.div variants={itemVariants} className="mt-6 max-w-xl">
              {t.sub.split('\n').map((line, i) => (
                <p key={i} className={`text-lg sm:text-xl leading-relaxed ${line.startsWith('•') ? 'text-brand-yellow font-semibold mt-2' : 'text-gray-400'}`}>
                  {line}
                </p>
              ))}
            </motion.div>

            {/* Mobile storefront photo */}
            <motion.div
              variants={itemVariants}
              className="lg:hidden mt-8 rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative"
            >
              <div className="relative w-full h-52 sm:h-64">
                <Image
                  src="/logo/frontpage.png"
                  alt="JC Central Tire Shop — Kent, Washington"
                  fill
                  className="object-cover object-top"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                  <MapPin size={11} className="text-brand-yellow" />
                  Kent, Washington
                </div>
              </div>
            </motion.div>

            {/* Single CTA */}
            <motion.div variants={itemVariants} className="mt-8 lg:mt-10 flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => scrollTo('#contact')}
                className="btn-primary text-base px-8 py-4"
              >
                {t.cta1}
                <ArrowRight size={18} />
              </button>
            </motion.div>

            {/* Trust badges */}
            <motion.div variants={itemVariants} className="mt-10 flex flex-wrap gap-x-7 gap-y-4">
              {badgeKeys.map((key, i) => {
                const Icon = badgeIcons[i]
                return (
                  <div key={key} className="flex items-center gap-2.5 text-gray-400 text-sm">
                    <div className="w-7 h-7 bg-brand-yellow/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon size={13} className="text-brand-yellow" />
                    </div>
                    {t.badges[key]}
                  </div>
                )
              })}
            </motion.div>
          </motion.div>

          {/* RIGHT — storefront hero card, desktop only */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            className="hidden lg:flex flex-shrink-0 w-[420px] xl:w-[480px] flex-col gap-3"
          >
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <div className="relative w-full h-[480px] xl:h-[540px]">
                <Image
                  src="/logo/frontpage.png"
                  alt="JC Central Tire Shop — Kent, Washington"
                  fill
                  className="object-cover object-top"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-white font-black text-xl leading-tight">JC Central Tire Shop</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <MapPin size={12} className="text-brand-yellow" />
                        <p className="text-gray-300 text-sm">Kent, Washington</p>
                      </div>
                    </div>
                    <div className="bg-brand-yellow text-black text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wide">
                      Open Today
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone quick-action */}
            <a
              href="tel:+12538138473"
              className="flex items-center justify-between bg-brand-yellow rounded-2xl px-6 py-4 group hover:bg-yellow-400 transition-colors"
            >
              <div>
                <p className="text-black font-black text-base leading-none">(253) 813-8473</p>
                <p className="text-black/60 text-xs mt-1 font-medium">Tap to call now</p>
              </div>
              <div className="w-10 h-10 bg-black/10 rounded-xl flex items-center justify-center group-hover:bg-black/20 transition-colors">
                <ArrowRight size={18} className="text-black" />
              </div>
            </a>
          </motion.div>

        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mt-16 rounded-2xl overflow-hidden border border-white/8"
        >
          {/* Mobile: single clean strip */}
          <div className="sm:hidden bg-[#111]/80 backdrop-blur-sm px-5 py-4 flex items-center justify-between gap-3">
            <div className="text-center">
              <div className="text-xl font-black text-white">10+</div>
              <div className="text-[10px] text-gray-500 leading-tight">Yrs in Business</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="text-xl font-black text-white">200K+</div>
              <div className="text-[10px] text-gray-500 leading-tight">Tires Installed</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center flex-1">
              <div className="text-brand-yellow font-black text-sm leading-tight">20–30 min</div>
              <div className="text-[10px] text-gray-500 leading-tight">Avg. Install Time</div>
            </div>
          </div>

          {/* Desktop: full 3-column grid */}
          <div className="hidden sm:grid grid-cols-3 gap-px bg-white/8">
            {(['years', 'tires', 'time'] as const).map((key) => (
              <div
                key={key}
                className="bg-[#111]/80 backdrop-blur-sm px-6 py-5 text-center hover:bg-brand-yellow/10 transition-colors duration-300"
              >
                <div className="text-3xl font-black text-white">{t.stats[key].value}</div>
                <div className="text-xs text-gray-500 mt-1 leading-tight">{t.stats[key].label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

    </section>
  )
}
