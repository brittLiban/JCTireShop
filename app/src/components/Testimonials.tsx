'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Star, Quote } from 'lucide-react'
import Image from 'next/image'
import type { GoogleReview } from '@/lib/google-reviews'

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

  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 5

  return (
    <section id="testimonials" className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between mb-16 gap-6"
        >
          <div>
            <span className="section-tag">Customer Reviews</span>
            <h2 className="section-title mt-2">
              What Our Customers Say
            </h2>
            <p className="section-subtitle max-w-xl">
              Real reviews from real people. We let our work speak for itself.
            </p>
          </div>

          {/* Google rating badge */}
          <div className="flex-shrink-0 bg-brand-dark rounded-2xl px-6 py-4 flex items-center gap-4">
            <svg viewBox="0 0 24 24" className="w-7 h-7 flex-shrink-0" aria-label="Google">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-white font-black text-2xl">
                  {avgRating.toFixed(1)}
                </span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
              </div>
              <p className="text-gray-500 text-xs mt-0.5">Google Reviews</p>
            </div>
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
