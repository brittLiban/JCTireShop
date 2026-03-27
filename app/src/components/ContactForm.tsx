'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { MapPin, Phone, Clock, Instagram } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { translations } from '@/lib/translations'

export default function ContactForm() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const { lang } = useLanguage()
  const t = translations[lang].contact

  const contactInfo = [
    { icon: MapPin,    label: t.labels.address,   value: t.address,            href: 'https://maps.google.com/?q=208+Central+Ave+S+Kent+WA+98032' },
    { icon: Phone,     label: t.labels.phone,     value: t.phone,              href: 'tel:+12538138473' },
    { icon: Phone,     label: '',                 value: t.phone2,             href: 'tel:+12063054349' },
    { icon: Instagram, label: t.labels.instagram, value: '@jccentraltireshop', href: 'https://instagram.com/jccentraltireshop' },
    { icon: Clock,     label: t.labels.hours,     value: t.hours,              href: null },
  ]

  return (
    <section id="contact" className="py-28 bg-brand-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mb-16"
        >
          <span className="section-tag">{t.tag}</span>
          <h2 className="section-title mt-2">{t.title}</h2>
          <p className="section-subtitle">{t.sub}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-xl"
        >
          <div className="bg-brand-dark rounded-2xl p-8">
            <h3 className="font-bold text-xl text-white mb-7">{t.findUs}</h3>
            <div className="space-y-6">
              {contactInfo.map(({ icon: Icon, label, value, href }) => (
                <div key={`${label}-${value}`} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-yellow/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={17} className="text-brand-yellow" />
                  </div>
                  <div>
                    {label && (
                      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                        {label}
                      </p>
                    )}
                    {href ? (
                      <a
                        href={href}
                        target={href.startsWith('http') ? '_blank' : undefined}
                        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="text-white font-medium text-sm hover:text-brand-yellow transition-colors mt-0.5 block"
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="text-white font-medium text-sm mt-0.5">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-xl overflow-hidden bg-brand-gray border border-white/10 h-40 flex items-center justify-center">
              <a
                href="https://maps.google.com/?q=208+Central+Ave+S+Kent+WA+98032"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm"
              >
                <MapPin size={16} className="text-brand-yellow" />
                View on Google Maps
              </a>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
