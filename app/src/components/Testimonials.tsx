'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Star, Quote } from 'lucide-react'
import Image from 'next/image'
import type { GoogleReview } from '@/lib/google-reviews'
import { useLanguage } from '@/contexts/LanguageContext'
import { translations } from '@/lib/translations'

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={13}
          className={
            i < rating
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-200 fill-gray-200'
          }
        />
      ))}
    </div>
  )
}

function ReviewCard({ review, index }: { review: GoogleReview; index: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
      className="bg-white rounded-2xl p-7 shadow-sm hover:shadow-xl
                 transition-all duration-300 flex flex-col
                 border border-gray-100 hover:border-yellow-100"
    >
      <Quote size={22} className="text-brand-red/20 mb-4 flex-shrink-0" />

      <p className="text-gray-600 text-sm leading-relaxed flex-1 italic">
        "{review.text}"
      </p>

      <div className="mt-6 pt-5 border-t border-gray-50 flex items-center gap-3">
        {review.profile_photo_url ? (
          <Image
            src={review.profile_photo_url}
            alt={review.author_name}
            width={40}
            height={40}
            className="rounded-full flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 bg-brand-red/8 rounded-full flex items-center justify-center text-brand-red font-bold text-sm flex-shrink-0">
            {review.author_name.charAt(0)}
          </div>
        )}
        <div>
          <p className="font-semibold text-brand-dark text-sm">
            {review.author_name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <StarRating rating={review.rating} />
            <span className="text-gray-400 text-xs">
              · {review.relative_time_description}
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

export default function Testimonials({ reviews }: { reviews: GoogleReview[] }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const { lang } = useLanguage()
  const t = translations[lang].testimonials

  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 5

  return (
    <section id="testimonials" className="py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between mb-16 gap-6"
        >
          <div>
            <span className="section-tag">{t.tag}</span>
            <h2 className="section-title mt-2">{t.title}</h2>
            <p className="section-subtitle max-w-xl">{t.sub}</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((review, i) => (
            <ReviewCard key={i} review={review} index={i} />
          ))}
        </div>

      </div>
    </section>
  )
}
