'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, CalendarDays, FileText, ListChecks } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Übersicht', icon: LayoutDashboard },
  { href: '/clients',   label: 'Klienten',  icon: Users },
  { href: '/calendar',  label: 'Kalender',  icon: CalendarDays },
  { href: '/sessions',  label: 'Sitzungen', icon: FileText },
  { href: '/tasks',     label: 'Aufgaben',  icon: ListChecks },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur-sm lg:hidden">
      <div className="flex h-16 items-stretch">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
                active ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-700'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'text-violet-600')} />
              <span className={active ? 'text-violet-600' : ''}>{label}</span>
            </Link>
          )
        })}
      </div>
      {/* Safe area für iPhone Home Indicator */}
      <div className="h-safe-bottom bg-white/95" style={{ height: 'env(safe-area-inset-bottom)' }} />
    </nav>
  )
}
