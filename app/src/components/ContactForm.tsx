'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { Send, MapPin, Phone, Clock, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLanguage } from '@/contexts/LanguageContext'
import { translations } from '@/lib/translations'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

type FormData = z.infer<typeof schema>

export default function ContactForm() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [loading, setLoading] = useState(false)
  const { lang } = useLanguage()
  const t = translations[lang].contact

  const contactInfo = [
    { icon: MapPin, label: t.labels.address, value: t.address, href: null },
    { icon: Phone, label: t.labels.phone, value: t.phone, href: 'tel:+15551234567' },
    { icon: Mail, label: 'Email', value: 'info@jctireshop.com', href: 'mailto:info@jctireshop.com' },
    { icon: Clock, label: t.labels.hours, value: t.hours, href: null },
  ]

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Server error')
      toast.success(t.labels.successMsg)
      reset()
    } catch {
      toast.error(t.labels.errorMsg)
    } finally {
      setLoading(false)
    }
  }

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

        <div className="grid lg:grid-cols-5 gap-8">

          {/* Info panel */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="bg-brand-dark rounded-2xl p-8 h-full">
              <h3 className="font-bold text-xl text-white mb-7">{t.findUs}</h3>
              <div className="space-y-6">
                {contactInfo.map(({ icon: Icon, label, value, href }) => (
                  <div key={label} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand-red/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon size={17} className="text-brand-red" />
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                        {label}
                      </p>
                      {href ? (
                        <a
                          href={href}
                          className="text-white font-medium text-sm hover:text-brand-red transition-colors mt-0.5 block"
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

              {/* Map placeholder */}
              <div className="mt-8 rounded-xl overflow-hidden bg-brand-gray border border-white/10 h-40 flex items-center justify-center">
                <a
                  href="https://maps.google.com/?q=123+Main+Street"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm"
                >
                  <MapPin size={16} className="text-brand-red" />
                  View on Google Maps
                </a>
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, x: 24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            onSubmit={handleSubmit(onSubmit)}
            className="lg:col-span-3 bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
          >
            <h3 className="font-bold text-xl text-brand-dark mb-6">{t.labels.send}</h3>

            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="admin-label">{t.labels.name} *</label>
                  <input
                    {...register('name')}
                    className="admin-input"
                    placeholder={t.labels.namePlaceholder}
                    autoComplete="name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1.5">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="admin-label">{t.labels.email} *</label>
                  <input
                    {...register('email')}
                    type="email"
                    className="admin-input"
                    placeholder={t.labels.emailPlaceholder}
                    autoComplete="email"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="admin-label">{t.labels.phoneField}</label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="admin-input"
                  placeholder={t.labels.phonePlaceholder}
                  autoComplete="tel"
                />
              </div>

              <div>
                <label className="admin-label">{t.labels.message} *</label>
                <textarea
                  {...register('message')}
                  rows={5}
                  className="admin-input resize-none"
                  placeholder={t.labels.messagePlaceholder}
                />
                {errors.message && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.message.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t.labels.sending}
                  </>
                ) : (
                  <>
                    {t.labels.send}
                    <Send size={16} />
                  </>
                )}
              </button>

              <p className="text-gray-400 text-xs text-center">
                We typically respond within a few hours during business hours.
              </p>
            </div>
          </motion.form>

        </div>
      </div>
    </section>
  )
}
