'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/settings/profile',  label: 'Stammdaten' },
  { href: '/settings/services', label: 'Leistungen' },
]

export function SettingsNav() {
  const pathname = usePathname()
  return (
    <div className="flex gap-1 border-b border-zinc-200">
      {tabs.map(tab => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            pathname.startsWith(tab.href)
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
