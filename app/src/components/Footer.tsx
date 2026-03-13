import Link from 'next/link'
import { Phone, Mail, MapPin, Clock } from 'lucide-react'

const quickLinks = [
  { href: '#services', label: 'Services' },
  { href: '#testimonials', label: 'Reviews' },
  { href: '#schedule', label: 'Book Appointment' },
  { href: '#contact', label: 'Contact Us' },
]

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-brand-red rounded-full flex items-center justify-center">
                <span className="text-white font-black text-sm">JC</span>
              </div>
              <span className="text-white font-bold text-base">JC Tire Shop</span>
            </div>
            <p className="text-sm leading-relaxed">
              Your trusted local tire experts. Quality service, fair prices,
              and honest work — every single time.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-5 uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-3 text-sm">
              {quickLinks.map(({ href, label }) => (
                <li key={href}>
                  <a
                    href={href}
                    className="hover:text-white transition-colors inline-flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 bg-brand-red rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-5 uppercase tracking-wider">
              Contact
            </h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-3">
                <Phone size={14} className="text-brand-red flex-shrink-0" />
                <a href="tel:+15551234567" className="hover:text-white transition-colors">
                  (555) 123-4567
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={14} className="text-brand-red flex-shrink-0" />
                <a href="mailto:info@jctireshop.com" className="hover:text-white transition-colors">
                  info@jctireshop.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={14} className="text-brand-red flex-shrink-0 mt-0.5" />
                <span>123 Main Street<br />Your City, ST 00000</span>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-5 uppercase tracking-wider">
              Hours
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Clock size={14} className="text-brand-red flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Mon – Friday</p>
                  <p>8:00 AM – 6:00 PM</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock size={14} className="text-brand-red flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Saturday</p>
                  <p>8:00 AM – 4:00 PM</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock size={14} className="text-gray-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-600 font-medium">Sunday</p>
                  <p className="text-gray-600">Closed</p>
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <p>© {new Date().getFullYear()} JC Tire Shop. All rights reserved.</p>
          <Link
            href="/admin/login"
            className="hover:text-white transition-colors opacity-40 hover:opacity-100"
          >
            Staff Login
          </Link>
        </div>
      </div>
    </footer>
  )
}
