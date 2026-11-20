'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Phone, MapPin } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

// Shown on the site from PROMO_START through PROMO_END (inclusive, Pacific time).
// The sale itself runs 11/27–12/2. After PROMO_END the section disappears on its own.
// Append ?promo=preview to the URL to force it on (for client previews).
const PROMO_START = '2026-11-21'
const PROMO_END = '2026-11-30'

const copy = {
  en: {
    tag: 'Black Friday Weekend Sale',
    headline: '20% OFF Everything!',
    dates: 'Valid 11/27 – 12/2',
    note: 'Bring in this coupon for validation. Financing available — get approved for up to $5,000.',
    call: 'Call (253) 813-8473',
    directions: 'Get Directions',
    alt: 'JC Central Tire Shop Black Friday Weekend Sale — 20% off everything, valid 11/27 to 12/2',
  },
  es: {
    tag: 'Venta de Fin de Semana de Black Friday',
    headline: '¡20% de Descuento en Todo!',
    dates: 'Válido del 27/11 al 2/12',
    note: 'Presente este cupón para validación. Financiamiento disponible — aprobación hasta $5,000.',
    call: 'Llamar (253) 813-8473',
    directions: 'Cómo Llegar',
    alt: 'Venta de Black Friday de JC Central Tire Shop — 20% de descuento en todo, válido del 27/11 al 2/12',
  },
}

function isPromoActive(): boolean {
  if (new URLSearchParams(window.location.search).get('promo') === 'preview') return true
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date())
  return today >= PROMO_START && today <= PROMO_END
}

export default function BlackFridayPromo() {
  const { lang } = useLanguage()
  const [active, setActive] = useState(false)

  // Evaluated in the browser so a cached page can never show a stale promo.
  useEffect(() => setActive(isPromoActive()), [])

  if (!active) return null
  const t = copy[lang]

  return (
    <section id="black-friday" className="bg-brand-yellow pt-36 sm:pt-44 pb-10 sm:pb-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-8 md:gap-12">
        <div className="w-full max-w-md md:max-w-sm lg:max-w-md flex-shrink-0 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-black/10">
          <Image
            src="/promo/black-friday-2026.jpg"
            alt={t.alt}
            width={1000}
            height={1000}
            sizes="(min-width: 768px) 448px, 100vw"
            className="w-full h-auto"
          />
        </div>

        <div className="text-center md:text-left text-black">
          <span className="inline-block bg-black text-brand-yellow px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-wide">
            {t.tag}
          </span>
          <h2 className="mt-4 text-4xl sm:text-5xl font-black leading-tight tracking-tight">{t.headline}</h2>
          <p className="mt-3 text-3xl sm:text-4xl font-black text-red-600 tracking-tight">{t.dates}</p>
          <p className="mt-4 text-lg font-medium max-w-md">{t.note}</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
            <a
              href="tel:+12538138473"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
            >
              <Phone size={18} />
              {t.call}
            </a>
            <a
              href="https://www.google.com/maps/search/?api=1&query=208+Central+Ave+S+Kent+WA+98032"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors"
            >
              <MapPin size={18} />
              {t.directions}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
