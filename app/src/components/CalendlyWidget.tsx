'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useEffect } from 'react'
import { Calendar, Clock, CheckCircle } from 'lucide-react'

const perks = [
  { icon: Clock, text: 'Pick your preferred date & time' },
  { icon: CheckCircle, text: 'Instant confirmation sent to your email' },
  { icon: Calendar, text: 'Easy to reschedule if plans change' },
]

export default function CalendlyWidget() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const calendlyUrl =
    process.env.NEXT_PUBLIC_CALENDLY_URL || 'https://calendly.com/jctireshop'

  useEffect(() => {
    const existing = document.querySelector(
      'script[src="https://assets.calendly.com/assets/external/widget.js"]'
    )
    if (existing) return

    const script = document.createElement('script')
    script.src = 'https://assets.calendly.com/assets/external/widget.js'
    script.async = true
    document.head.appendChild(script)
  }, [])

  return (
    <section id="schedule" className="py-28 bg-brand-dark relative overflow-hidden">

      {/* Background accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-red to-transparent opacity-30" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-red/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid lg:grid-cols-5 gap-12 items-start">

          {/* Left: copy */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-red/10 border border-brand-red/20 rounded-2xl mb-5">
              <Calendar size={26} className="text-brand-red" />
            </div>
            <span className="section-tag">Book Online</span>
            <h2 className="text-3xl md:text-4xl font-black text-white mt-2 leading-tight">
              Schedule Your
              <br />
              Appointment
            </h2>
            <p className="text-gray-400 mt-4 leading-relaxed">
              Pick a time that works for you. We'll have everything ready when you arrive.
            </p>

            <ul className="mt-8 space-y-4">
              {perks.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-gray-400 text-sm">
                  <div className="w-8 h-8 bg-brand-red/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon size={15} className="text-brand-red" />
                  </div>
                  {text}
                </li>
              ))}
            </ul>

            <div className="mt-10 p-5 bg-white/5 border border-white/10 rounded-2xl">
              <p className="text-white text-sm font-semibold">Prefer to call?</p>
              <a
                href="tel:+15551234567"
                className="text-brand-red font-bold text-lg hover:text-red-400 transition-colors"
              >
                (555) 123-4567
              </a>
              <p className="text-gray-500 text-xs mt-1">Mon – Sat, 8am – 6pm</p>
            </div>
          </motion.div>

          {/* Right: Calendly embed */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-3 rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10"
          >
            <div
              className="calendly-inline-widget"
              data-url={`${calendlyUrl}?hide_landing_page_details=1&hide_gdpr_banner=1&background_color=1A1A1A&text_color=f9fafb&primary_color=DC2626`}
              style={{ minWidth: '320px', height: '680px' }}
            />
          </motion.div>

        </div>
      </div>
    </section>
  )
}
