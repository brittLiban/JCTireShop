import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { LanguageProvider } from '@/contexts/LanguageContext'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'JC Tire Shop | Professional Tire Services',
    template: '%s | JC Tire Shop',
  },
  description:
    'JC Tire Shop — your trusted local tire experts. Fast installation, competitive prices, expert service, and same-day appointments available.',
  keywords: [
    'tire shop',
    'tires',
    'tire installation',
    'tire repair',
    'wheel alignment',
    'tire rotation',
    'flat repair',
    'local tire shop',
  ],
  openGraph: {
    title: 'JC Tire Shop',
    description: 'Your trusted local tire experts. Fast, fair, and professional.',
    type: 'website',
    url: 'https://jctireshop.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JC Tire Shop',
    description: 'Your trusted local tire experts.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <LanguageProvider>
        {children}
        </LanguageProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              fontFamily: 'var(--font-inter)',
            },
            success: {
              style: {
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#166534',
              },
            },
            error: {
              style: {
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
