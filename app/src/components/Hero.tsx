'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Shield, Clock, Star, Wrench } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { translations } from '@/lib/translations'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const badgeIcons = [Shield, Clock, Star, Wrench]

export default function Hero() {
  const { lang } = useLanguage()
  const t = translations[lang].hero

  const scrollTo = (id: string) =>
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })

  const badgeKeys = ['licensed', 'sameDay', 'rated', 'expert'] as const

  return (
    <section className="relative min-h-screen flex items-center bg-brand-dark overflow-hidden pt-[4.5rem]">

      {/* Fine dot grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(circle at 1.5px 1.5px, white 1.5px, transparent 0)`,
          backgroundSize: '36px 36px',
        }}
      />

      {/* Diagonal yellow slash — the signature element */}
      <div className="hero-slash absolute right-0 top-0 h-full w-[45%] origin-top-right pointer-events-none hidden lg:block" />

      {/* Concentric tire rings — right side */}
      <div className="hero-ring-lg absolute rounded-full border border-white/[0.04] pointer-events-none hidden lg:block top-1/2 -translate-y-1/2" />
      <div className="hero-ring-md absolute rounded-full border border-white/[0.04] pointer-events-none hidden lg:block top-1/2 -translate-y-1/2 opacity-80" />
      <div className="hero-ring-sm absolute rounded-full border border-white/[0.04] pointer-events-none hidden lg:block top-1/2 -translate-y-1/2 opacity-60" />

      {/* Glow blobs */}
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
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-3xl"
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
            className="mt-6 text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black text-white leading-[1.02] tracking-tight"
          >
            {t.headline1}{' '}
            <span className="relative inline-block text-brand-yellow">
              {t.headline2}
              {/* Underline squiggle */}
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
          <motion.p
            variants={itemVariants}
            className="mt-8 text-lg sm:text-xl text-gray-400 leading-relaxed max-w-xl"
          >
            {t.sub}
          </motion.p>

          {/* CTAs */}
          <motion.div variants={itemVariants} className="mt-10 flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => scrollTo('#schedule')}
              className="btn-primary text-base px-8 py-4"
            >
              {t.cta1}
              <ArrowRight size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollTo('#contact')}
              className="btn-outline text-base px-8 py-4"
            >
              {t.cta2}
            </button>
          </motion.div>

          {/* Trust badges */}
          <motion.div variants={itemVariants} className="mt-12 flex flex-wrap gap-x-7 gap-y-4">
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

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/8 rounded-2xl overflow-hidden border border-white/8"
        >
          {(['years', 'tires', 'rating', 'time'] as const).map((key) => (
            <div
              key={key}
              className="bg-[#111]/80 backdrop-blur-sm px-6 py-5 text-center hover:bg-brand-yellow/10 transition-colors duration-300"
            >
              <div className="text-2xl sm:text-3xl font-black text-white">{t.stats[key].value}</div>
              <div className="text-xs text-gray-500 mt-1 leading-tight">{t.stats[key].label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
        aria-hidden
      >
        <span className="text-gray-600 text-[10px] tracking-[0.2em] uppercase font-medium">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-gray-600 to-transparent" />
      </motion.div>
    </section>
  )
}
