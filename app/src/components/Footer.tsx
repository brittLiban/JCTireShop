'use client'

import Link from 'next/link'
import { Phone, MapPin, Clock, Instagram } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { translations } from '@/lib/translations'

export default function Footer() {
  const { lang } = useLanguage()
  const t = translations[lang].footer

  const quickLinks = [
    { href: '#services', label: t.links.services },
    { href: '#testimonials', label: t.links.reviews },
    { href: '#schedule', label: t.links.book },
    { href: '#contact', label: t.links.contact },
  ]

  return (
    <footer className="bg-brand-dark text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="lg:col-span-1">
            <p className="text-sm leading-relaxed">{t.tagline}</p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-5 uppercase tracking-wider">
              {t.quickLinks}
            </h4>
            <ul className="space-y-3 text-sm">
              {quickLinks.map(({ href, label }) => (
                <li key={href}>
                  <a
                    href={href}
                    className="hover:text-white transition-colors inline-flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 bg-brand-yellow rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-5 uppercase tracking-wider">
              {t.contactTitle}
            </h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-3">
                <Phone size={14} className="text-brand-yellow flex-shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <a href="tel:+12538138473" className="hover:text-white transition-colors">(253) 813-8473</a>
                  <a href="tel:+12063054349" className="hover:text-white transition-colors">(206) 305-4349</a>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Instagram size={14} className="text-brand-yellow flex-shrink-0" />
                <a href="https://instagram.com/jccentraltireshop" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  @jccentraltireshop
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={14} className="text-brand-yellow flex-shrink-0 mt-0.5" />
                <span>208 Central Ave S<br />Kent, WA 98032</span>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-5 uppercase tracking-wider">
              {t.hoursTitle}
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Clock size={14} className="text-brand-yellow flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">{t.hours.weekdays}</p>
                  <p>{t.hours.weekdayTime}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock size={14} className="text-brand-yellow flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">{t.hours.saturday}</p>
                  <p>{t.hours.saturdayTime}</p>
                </div>
              </li>
              {t.hours.sunday && (
                <li className="flex items-start gap-3">
                  <Clock size={14} className="text-gray-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-600 font-medium">{t.hours.sunday}</p>
                    <p className="text-gray-600">{t.hours.sundayTime}</p>
                  </div>
                </li>
              )}
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <p>© {new Date().getFullYear()} {t.copyright}</p>
          <Link
            href="/admin/login"
            className="hover:text-white transition-colors opacity-40 hover:opacity-100"
          >
            {t.staffLogin}
          </Link>
        </div>
      </div>
    </footer>
  )
}
