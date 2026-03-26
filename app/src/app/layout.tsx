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

const SITE_URL = 'https://jctireshop.com'
const BUSINESS_NAME = 'JC Central Tire Shop'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: `${BUSINESS_NAME} | #1 Tire Shop in Kent, WA — New & Used Tires`,
    template: `%s | ${BUSINESS_NAME} — Kent, WA`,
  },

  description:
    'JC Central Tire Shop in Kent, WA. New & used tires with warranty, mount & balance, tire repair, rotation, new rims. Walk-ins welcome — Mon–Sat 8:30AM–6:30PM, Sun 9AM–5PM. Se Habla Español. Call (253) 813-8473.',

  keywords: [
    // English — local
    'tire shop Kent WA',
    'tire shop Kent Washington',
    'tires Kent WA',
    'cheap tires Kent Washington',
    'used tires Kent WA',
    'new tires Kent Washington',
    'tire repair Kent WA',
    'tire installation Kent WA',
    'mount and balance Kent WA',
    'tire rotation Kent WA',
    'flat tire repair Kent',
    'tire shop near me Kent',
    'affordable tire shop Kent WA',
    'tire shop 98032',
    'JC Central Tire Shop',
    'tire plug patch Kent WA',
    'used tires with warranty Kent',
    'all terrain tires Kent WA',
    'new rims Kent WA',
    'walk in tire shop Kent',
    'same day tire service Kent WA',
    // Spanish — local
    'llantería Kent WA',
    'llantas Kent Washington',
    'taller de llantas Kent',
    'llantas usadas Kent WA',
    'llantas nuevas Kent Washington',
    'reparación de llantas Kent',
    'montaje de llantas Kent WA',
    'llantas baratas Kent WA',
    'ponchadura Kent WA',
    'se habla español llantería Kent',
    'rines nuevos Kent WA',
    'servicio de llantas Kent Washington',
    'llantas con garantía Kent WA',
  ],

  authors: [{ name: BUSINESS_NAME, url: SITE_URL }],
  creator: BUSINESS_NAME,
  publisher: BUSINESS_NAME,

  alternates: {
    canonical: SITE_URL,
    languages: {
      'en-US': SITE_URL,
      'es-US': `${SITE_URL}?lang=es`,
    },
  },

  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: BUSINESS_NAME,
    title: `${BUSINESS_NAME} | #1 Tire Shop in Kent, WA`,
    description:
      'New & used tires with warranty, mount & balance, tire repair. Walk-ins welcome. Se Habla Español. (253) 813-8473 · 208 Central Ave S, Kent WA 98032.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'JC Central Tire Shop — Kent, WA',
      },
    ],
    locale: 'en_US',
  },

  twitter: {
    card: 'summary_large_image',
    title: `${BUSINESS_NAME} | Tire Shop Kent, WA`,
    description:
      'New & used tires, mount & balance, repairs. Walk-ins welcome. Se Habla Español. Kent, WA.',
    images: ['/og-image.jpg'],
  },

  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  verification: {
    // Add your Google Search Console verification token here when ready:
    // google: 'your-token-here',
  },

  category: 'automotive',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Geo / local SEO signals */}
        <meta name="geo.region" content="US-WA" />
        <meta name="geo.placename" content="Kent, Washington" />
        <meta name="geo.position" content="47.3809;-122.2348" />
        <meta name="ICBM" content="47.3809, -122.2348" />
        {/* Business contact */}
        <meta name="contact" content="(253) 813-8473" />
        <meta name="reply-to" content="info@jctireshop.com" />
      </head>
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '12px', fontFamily: 'var(--font-inter)' },
            success: {
              style: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' },
            },
            error: {
              style: { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' },
            },
          }}
        />
      </body>
    </html>
  )
}
