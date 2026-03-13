'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Phone } from 'lucide-react'

const navLinks = [
  { href: '#services', label: 'Services' },
  { href: '#testimonials', label: 'Reviews' },
  { href: '#schedule', label: 'Book Appointment' },
  { href: '#contact', label: 'Contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    setOpen(false)
    const el = document.querySelector(href)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-brand-dark/95 backdrop-blur-sm shadow-2xl shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-brand-red rounded-full flex items-center justify-center shadow-lg shadow-red-900/30 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-sm tracking-tight">JC</span>
            </div>
            <div className="leading-none">
              <span className="text-white font-bold text-base tracking-tight block">
                JC Tire Shop
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
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
            <a
              href="tel:+15551234567"
              className="flex items-center gap-2 bg-brand-red text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-900/25 active:scale-95"
            >
              <Phone size={14} />
              Call Now
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle navigation menu"
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={`md:hidden bg-brand-dark border-t border-white/10 overflow-hidden transition-all duration-300 ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 py-6 flex flex-col gap-1">
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
            Call Now
          </a>
        </div>
      </div>
    </nav>
  )
}
