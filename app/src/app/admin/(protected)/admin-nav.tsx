'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LayoutDashboard, Package, Truck, LogOut, ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/inventory', label: 'Inventory', icon: Package, exact: false },
  { href: '/admin/orders', label: 'Supplier Orders', icon: Truck, exact: false },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <aside className="w-60 min-h-screen bg-brand-dark flex flex-col border-r border-white/10 flex-shrink-0">

      {/* Brand */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-red rounded-full flex items-center justify-center">
            <span className="text-white font-black text-xs">JC</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">JC Tire Shop</p>
            <p className="text-gray-500 text-xs mt-0.5">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-brand-red text-white shadow-lg shadow-red-900/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/8'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 space-y-1 border-t border-white/10">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/8 transition-all w-full"
        >
          <ExternalLink size={16} />
          View Website
        </a>
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/8 transition-all w-full"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
