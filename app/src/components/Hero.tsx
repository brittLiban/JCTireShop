'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Shield, Clock, Star, Wrench } from 'lucide-react'

const badges = [
  { icon: Shield, text: 'Licensed & Insured' },
  { icon: Clock, text: 'Same-Day Service' },
  { icon: Star, text: '5-Star Rated' },
  { icon: Wrench, text: 'Expert Technicians' },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function Hero() {
  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-screen flex items-center bg-brand-dark overflow-hidden">

      {/* Dot-grid background */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 1.5px 1.5px, white 1.5px, transparent 0)`,
          backgroundSize: '36px 36px',
        }}
      />

      {/* Gradient blobs */}
      <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-brand-red/8 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-brand-red/6 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-brand-red/4 rounded-full blur-3xl pointer-events-none" />

      {/* Large faint tire ring decoration */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] border border-white/5 rounded-full pointer-events-none hidden lg:block" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/3 w-[400px] h-[400px] border border-white/5 rounded-full pointer-events-none hidden lg:block" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 w-full">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-3xl"
        >
          {/* Tag */}
          <motion.div variants={itemVariants}>
            <span className="inline-flex items-center gap-2 bg-brand-red/10 border border-brand-red/25 text-brand-red px-4 py-1.5 rounded-full text-sm font-semibold">
              <span className="w-1.5 h-1.5 bg-brand-red rounded-full animate-pulse" />
              Your Local Tire Experts
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="mt-6 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[1.02] tracking-tight"
          >
            Tires You Can{' '}
            <span className="text-brand-red relative">
              Trust.
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 200 8"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 6 Q50 2 100 5 Q150 8 200 4"
                  stroke="#DC2626"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.5"
                />
              </svg>
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="mt-8 text-xl text-gray-400 leading-relaxed max-w-xl"
          >
            Expert tire services, fair prices, and fast turnaround. We keep
            your vehicle safe and your wallet happy — every single time.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={itemVariants}
            className="mt-10 flex flex-col sm:flex-row gap-4"
          >
            <button
              onClick={() => scrollTo('#schedule')}
              className="btn-primary text-base px-8 py-4 text-lg"
            >
              Book Appointment
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => scrollTo('#contact')}
              className="btn-outline text-base px-8 py-4 text-lg"
            >
              Get a Free Quote
            </button>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            variants={itemVariants}
            className="mt-14 flex flex-wrap gap-x-8 gap-y-4"
          >
            {badges.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2.5 text-gray-400 text-sm"
              >
                <div className="w-7 h-7 bg-brand-red/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-brand-red" />
                </div>
                {text}
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden"
        >
          {[
            { value: '10+', label: 'Years in Business' },
            { value: '5,000+', label: 'Tires Installed' },
            { value: '4.9★', label: 'Google Rating' },
            { value: '1hr', label: 'Avg. Service Time' },
          ].map(({ value, label }) => (
            <div
              key={label}
              className="bg-brand-gray/80 backdrop-blur-sm px-6 py-5 text-center"
            >
              <div className="text-2xl font-black text-white">{value}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
        aria-hidden
      >
        <span className="text-gray-600 text-xs tracking-widest uppercase font-medium">
          Scroll
        </span>
        <div className="w-px h-10 bg-gradient-to-b from-gray-600 to-transparent" />
      </motion.div>
    </section>
  )
}
