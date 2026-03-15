'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
    { href: '#contact', label: t.contact },
  ]

  return (
    <>
      {/* Announcement bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-brand-yellow h-9 flex items-center justify-center gap-4">
        <p className="text-black text-xs font-bold tracking-wide text-center px-4">
          {t.announcement}
        </p>
        <span className="hidden sm:inline-flex items-center gap-1.5 bg-black text-brand-yellow text-xs font-black px-2.5 py-1 rounded-full tracking-wide uppercase">
          ★ Se Habla Español
        </span>
      </div>

      {/* Main nav */}
      <nav
        className="fixed top-9 left-0 right-0 z-50 bg-brand-dark shadow-2xl shadow-black/30"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center flex-shrink-0 group">
              <Image
                src="/logo.png"
                alt="JC Central Tire Shop"
                width={160}
                height={60}
                className="h-12 w-auto object-contain group-hover:scale-105 transition-transform duration-200"
                priority
              />
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
                  <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-brand-yellow group-hover:w-full transition-all duration-300" />
                </a>
              ))}

              {/* Language toggle */}
              <button
                onClick={toggle}
                className="flex items-center gap-1.5 border border-white/20 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-300 hover:border-brand-yellow/60 hover:text-brand-yellow transition-all"
                type="button"
                aria-label="Switch language"
              >
                <span className={lang === 'en' ? 'text-brand-yellow' : 'text-gray-500'}>EN</span>
                <span className="text-gray-600">|</span>
                <span className={lang === 'es' ? 'text-brand-yellow' : 'text-gray-500'}>ES</span>
              </button>

              <a
                href="tel:+15551234567"
                className="flex items-center gap-2 bg-brand-yellow text-black px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-900/20 active:scale-95"
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
                className="border border-white/20 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-300 hover:text-brand-yellow transition-all"
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
            <div className="mt-2 text-center text-brand-yellow text-xs font-bold tracking-widest uppercase">
              ★ Se Habla Español
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
