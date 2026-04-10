'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import Image from 'next/image'
import { Phone } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function SnapFinance() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const { lang } = useLanguage()

  return (
    <section ref={ref} className="py-10 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header — shown above everything */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-2 bg-brand-yellow/15 border border-brand-yellow/30 text-brand-dark px-5 py-2 rounded-full text-lg font-black tracking-wide">
            💳 {lang === 'en' ? 'Financing Available — We can approve you up to $5,000!' : '¡Financiamiento Disponible — Te aprobamos hasta $5,000!'}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col lg:flex-row items-center gap-12"
        >
          {/* Flyer image — appears first on all screens */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-shrink-0 w-80 sm:w-96"
          >
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src={lang === 'en' ? '/snap-en.png' : '/snap-es.png'}
                alt="Snap Finance — Get approved for up to $5,000"
                width={500}
                height={700}
                className="w-full h-auto object-contain"
              />
            </div>
          </motion.div>

          {/* Text — English only; hidden on Spanish */}
          {lang === 'en' && (
            <div className="flex-1 max-w-lg">
              <h2 className="text-3xl sm:text-4xl font-black text-brand-dark leading-tight tracking-tight">
                Get approved for up to <span className="text-brand-yellow">$5,000</span>
              </h2>

              <p className="mt-4 text-gray-500 text-lg leading-relaxed">
                Bad credit? No credit? No problem. Get approved through Snap Finance with no interest for the first 100 days. Apply in minutes — shop today, pay later.
              </p>

              <ul className="mt-6 space-y-3">
                {[
                  'No credit needed — approval based on income',
                  'No interest for the first 100 days',
                  'Easy application — approved in minutes',
                  'Flexible payment plans',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-gray-600 text-sm">
                    <span className="w-5 h-5 rounded-full bg-brand-yellow flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-black text-[10px] font-black">✓</span>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <a
                href="tel:+12538138473"
                className="mt-8 inline-flex items-center gap-2 bg-brand-dark text-white font-black text-base px-8 py-4 rounded-xl hover:bg-brand-yellow hover:text-black transition-all duration-200 shadow-lg"
              >
                <Phone size={18} />
                Call Now to Apply — or scan the QR code!
              </a>
            </div>
          )}

          {/* Spanish: just a centered CTA below the flyer on mobile */}
          {lang === 'es' && (
            <div className="flex flex-col items-center lg:items-start gap-4">
              <a
                href="tel:+12538138473"
                className="inline-flex items-center gap-2 bg-brand-dark text-white font-black text-base px-8 py-4 rounded-xl hover:bg-brand-yellow hover:text-black transition-all duration-200 shadow-lg"
              >
                <Phone size={18} />
                Llame Ahora para Aplicar — ¡o escanee el código QR!
              </a>
            </div>
          )}

        </motion.div>
      </div>
    </section>
  )
}
