'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, Package, Truck, LogOut, ExternalLink,
  ScanLine, Box, Upload, ClipboardList, Menu, X,
} from 'lucide-react'
import { clsx } from 'clsx'

const navGroups = [
  {
    label: null,
    items: [
      { href: '/admin',           label: 'Dashboard',       icon: LayoutDashboard, exact: true },
      { href: '/admin/inventory', label: 'Inventory',       icon: Package,         exact: false },
      { href: '/admin/orders',    label: 'Supplier Orders', icon: Truck,           exact: false },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/admin/scan',       label: 'Scan Inventory', icon: ScanLine, exact: false },
      { href: '/admin/containers', label: 'Containers',     icon: Box,      exact: false },
    ],
  },
  {
    label: 'Data',
    items: [
      { href: '/admin/import',   label: 'Excel Import', icon: Upload,        exact: false },
      { href: '/admin/scan-log', label: 'Scan Log',     icon: ClipboardList, exact: false },
    ],
  },
]

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <>
      {/* Brand */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-red rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-xs">JC</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">JC Tire Shop</p>
            <p className="text-gray-500 text-xs mt-0.5">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="px-3 mb-1 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
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
            </div>
          </div>
        ))}
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
    </>
  )
}

export default function AdminNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* ── MOBILE TOP BAR ─────────────────────────────────────────────── */}
      <div className="sm:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-brand-dark border-b border-white/10 flex items-center px-4 gap-3">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="p-1.5 text-gray-400 hover:text-white transition-colors"
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-red rounded-full flex items-center justify-center">
            <span className="text-white font-black text-[10px]">JC</span>
          </div>
          <p className="text-white font-bold text-sm">JC Tire Shop</p>
        </div>
      </div>

      {/* ── MOBILE DRAWER ──────────────────────────────────────────────── */}
      {open && (
        <div className="sm:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <aside className="relative w-72 max-w-[85vw] min-h-screen bg-brand-dark flex flex-col border-r border-white/10 shadow-2xl">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <NavContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── DESKTOP SIDEBAR (unchanged) ────────────────────────────────── */}
      <aside className="hidden sm:flex w-60 min-h-screen bg-brand-dark flex-col border-r border-white/10 flex-shrink-0">
        <NavContent />
      </aside>
    </>
  )
}
