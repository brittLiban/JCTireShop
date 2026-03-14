'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Phone } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { translations } from '@/lib/translations'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { lang, toggle } = useLanguage()
  const t = translations[lang].nav

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    setOpen(false)
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const navLinks = [
    { href: '#services', label: t.services },
    { href: '#testimonials', label: t.reviews },
    { href: '#schedule', label: t.book },
    { href: '#contact', label: t.contact },
  ]

  return (
    <>
      {/* Announcement bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-brand-red h-9 flex items-center justify-center">
        <p className="text-white text-xs font-semibold tracking-wide text-center px-4">
          {t.announcement}
        </p>
      </div>

      {/* Main nav */}
      <nav
        className={`fixed top-9 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-brand-dark/97 backdrop-blur-md shadow-2xl shadow-black/30'
            : 'bg-brand-dark/80 backdrop-blur-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
              <div className="relative">
                <div className="w-9 h-9 bg-brand-red rounded-full flex items-center justify-center shadow-lg shadow-red-900/40 group-hover:scale-105 transition-transform">
                  <span className="text-white font-black text-sm tracking-tight">JC</span>
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-white rounded-full border-2 border-brand-dark" />
              </div>
              <div className="leading-none">
                <span className="text-white font-black text-base tracking-tight block">JC Tire Shop</span>
                <span className="text-gray-500 text-[10px] tracking-widest uppercase font-medium">Est. 2010</span>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-7">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => scrollTo(e, link.href)}
                  className="text-gray-300 hover:text-white font-medium transition-colors text-sm tracking-wide relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-brand-red group-hover:w-full transition-all duration-300" />
                </a>
              ))}

              {/* Language toggle */}
              <button
                onClick={toggle}
                className="flex items-center gap-1.5 border border-white/20 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-300 hover:border-white/50 hover:text-white transition-all"
                type="button"
                aria-label="Switch language"
              >
                <span className={lang === 'en' ? 'text-white' : 'text-gray-500'}>EN</span>
                <span className="text-gray-600">|</span>
                <span className={lang === 'es' ? 'text-white' : 'text-gray-500'}>ES</span>
              </button>

              <a
                href="tel:+15551234567"
                className="flex items-center gap-2 bg-brand-red text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-900/25 active:scale-95"
              >
                <Phone size={13} />
                {t.callNow}
              </a>
            </div>

            {/* Mobile controls */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={toggle}
                type="button"
                className="border border-white/20 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-300 hover:text-white transition-all"
              >
                {lang === 'en' ? 'ES' : 'EN'}
              </button>
              <button
                type="button"
                className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setOpen(!open)}
                aria-label="Toggle navigation menu"
                aria-expanded={open ? 'true' : 'false'}
              >
                {open ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile drawer */}
        <div
          className={`md:hidden bg-brand-dark border-t border-white/10 overflow-hidden transition-all duration-300 ${
            open ? 'max-h-[28rem] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 py-5 flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => scrollTo(e, link.href)}
                className="text-gray-200 text-base font-medium py-3 px-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="tel:+15551234567"
              className="btn-primary w-full text-center mt-3 py-3.5"
            >
              <Phone size={16} />
              {t.callNow}
            </a>
          </div>
        </div>
      </nav>
    </>
  )
}
