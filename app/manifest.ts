import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nexum',
    short_name: 'Nexum',
    description: 'Das Betriebssystem für Menschen, die Menschen begleiten.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#18181b',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      // TODO vor Go-Live: echte PNGs (192x192 + 512x512 maskable) generieren
      // und hier eintragen — iOS Safari benötigt apple-touch-icon.png
    ],
    categories: ['productivity', 'health'],
    lang: 'de',
  }
}
