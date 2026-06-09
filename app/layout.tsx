import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'Nexum',
    template: '%s · Nexum',
  },
  description: 'Das Betriebssystem für Menschen, die Menschen begleiten.',
  applicationName: 'Nexum',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Nexum',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    title: 'Nexum',
    description: 'Das Betriebssystem für Menschen, die Menschen begleiten.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,          // verhindert ungewolltes Zoomen in iOS
  themeColor: '#18181b',    // zinc-900 — Statusbar-Farbe auf Android/iOS
  colorScheme: 'light',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <head>
        {/* PWA / Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Nexum" />
      </head>
      <body className="min-h-full flex flex-col bg-zinc-50 font-sans">
        {children}
      </body>
    </html>
  )
}
