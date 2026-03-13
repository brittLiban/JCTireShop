'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import {
  Wrench,
  RotateCcw,
  Gauge,
  Search,
  ShieldCheck,
  Zap,
} from 'lucide-react'

const services = [
  {
    icon: Wrench,
    title: 'Tire Installation',
    description:
      'Professional mounting and balancing for all tire types and vehicle sizes. Precision work on every vehicle.',
  },
  {
    icon: RotateCcw,
    title: 'Tire Rotation',
    description:
      'Extend your tire life and maintain even tread wear with regular rotation on the correct schedule.',
  },
  {
    icon: Gauge,
    title: 'Wheel Alignment',
    description:
      'Precision alignment to keep your vehicle driving straight, reduce uneven wear, and improve fuel economy.',
  },
  {
    icon: Search,
    title: 'Tire Inspection',
    description:
      'Thorough inspection of tread depth, sidewall condition, and overall health — free with any service.',
  },
  {
    icon: ShieldCheck,
    title: 'Flat Repair',
    description:
      'Fast, reliable puncture repairs to get you safely back on the road without delay or hassle.',
  },
  {
    icon: Zap,
    title: 'Same-Day Service',
    description:
      "Walk-ins welcome. Most services are completed within the hour so you're not waiting around all day.",
  },
]

function ServiceCard({
  service,
  index,
}: {
  service: (typeof services)[0]
  index: number
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const Icon = service.icon

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
      className="group relative bg-white border border-gray-100 rounded-2xl p-7
                 hover:border-brand-red/20 hover:shadow-2xl hover:shadow-red-50
                 transition-all duration-300 cursor-default"
    >
      {/* Hover accent line */}
      <div className="absolute top-0 left-6 right-6 h-0.5 bg-brand-red rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

      <div className="w-12 h-12 bg-brand-red/8 rounded-xl flex items-center justify-center mb-5 group-hover:bg-brand-red transition-colors duration-300">
        <Icon
          size={22}
          className="text-brand-red group-hover:text-white transition-colors duration-300"
        />
      </div>

      <h3 className="font-bold text-lg text-brand-dark mb-2 leading-snug">
        {service.title}
      </h3>
      <p className="text-gray-500 text-sm leading-relaxed">
        {service.description}
      </p>
    </motion.div>
  )
}

export default function Services() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="services" className="py-28 bg-brand-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mb-16"
        >
          <span className="section-tag">What We Do</span>
          <h2 className="section-title mt-2">
            Everything Your Tires Need
          </h2>
          <p className="section-subtitle">
            From installation to emergency repairs — we handle every aspect of
            your tire needs with speed, expertise, and care.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((service, i) => (
            <ServiceCard key={service.title} service={service} index={i} />
          ))}
        </div>

        {/* CTA strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-14 bg-brand-dark rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div>
            <p className="text-white font-bold text-xl">Not sure what you need?</p>
            <p className="text-gray-400 text-sm mt-1">
              Call us or drop by — we'll take a look and tell you exactly what's going on, for free.
            </p>
          </div>
          <a
            href="tel:+15551234567"
            className="btn-primary flex-shrink-0 px-8 py-4 text-base"
          >
            Call (555) 123-4567
          </a>
        </motion.div>

      </div>
    </section>
  )
}
