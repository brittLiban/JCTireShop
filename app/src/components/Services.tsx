'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Wrench, RotateCcw, Gauge, Search, ShieldCheck, Zap } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { translations } from '@/lib/translations'

const icons = [Wrench, RotateCcw, Gauge, Search, ShieldCheck, Zap]
const nums = ['01', '02', '03', '04', '05', '06']

function ServiceCard({ title, description, icon: Icon, num, index }: {
  title: string
  description: string
  icon: typeof Wrench
  num: string
  index: number
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
      className="group relative bg-white border border-gray-100 rounded-2xl p-7
                 hover:border-brand-red/20 hover:shadow-2xl hover:shadow-red-50
                 transition-all duration-300 cursor-default overflow-hidden"
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-6 right-6 h-0.5 bg-brand-red rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

      {/* Large faint number watermark */}
      <span className="absolute -top-3 -right-1 text-8xl font-black text-gray-100 select-none group-hover:text-brand-red/10 transition-colors duration-300 leading-none">
        {num}
      </span>

      <div className="relative">
        <div className="w-12 h-12 bg-brand-red/8 rounded-xl flex items-center justify-center mb-5 group-hover:bg-brand-red transition-colors duration-300">
          <Icon size={21} className="text-brand-red group-hover:text-white transition-colors duration-300" />
        </div>
        <h3 className="font-black text-base text-brand-dark mb-2 leading-snug tracking-tight">
          {title}
        </h3>
        <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
      </div>
    </motion.div>
  )
}

export default function Services() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const { lang } = useLanguage()
  const t = translations[lang].services

  return (
    <section id="services" className="py-28 bg-brand-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header — left-aligned, editorial */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16"
        >
          <div className="max-w-xl">
            <span className="section-tag">{t.tag}</span>
            <h2 className="section-title mt-2">{t.title}</h2>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed max-w-sm md:text-right">{t.sub}</p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {t.items.map((item, i) => (
            <ServiceCard
              key={i}
              title={item.title}
              description={item.description}
              icon={icons[i]}
              num={nums[i]}
              index={i}
            />
          ))}
        </div>

        {/* CTA strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 bg-brand-dark rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
        >
          {/* Decorative slash */}
          <div className="absolute inset-0 pointer-events-none hero-slash opacity-50" />
          <div className="relative">
            <p className="text-white font-black text-xl tracking-tight">{t.ctaTitle}</p>
            <p className="text-gray-400 text-sm mt-1">{t.ctaSub}</p>
          </div>
          <a href="tel:+15551234567" className="btn-primary flex-shrink-0 px-8 py-4 text-base relative">
            {t.ctaBtn}
          </a>
        </motion.div>

      </div>
    </section>
  )
}
