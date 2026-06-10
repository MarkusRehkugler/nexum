'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  Receipt,
  ListChecks,
  FolderOpen,
  Shield,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logoutAction } from '@/modules/auth/actions'

const navItems = [
  { href: '/dashboard', label: 'Übersicht', icon: LayoutDashboard },
  { href: '/clients', label: 'Klienten', icon: Users },
  { href: '/sessions', label: 'Sitzungen', icon: FileText },
  { href: '/calendar', label: 'Kalender', icon: CalendarDays },
  { href: '/tasks', label: 'Aufgaben', icon: ListChecks },
  { href: '/invoices', label: 'Rechnungen', icon: Receipt },
  { href: '/documents', label: 'Dokumente', icon: FolderOpen },
]

interface Props {
  displayName: string
  email: string
  isAdmin?: boolean
}

export function Sidebar({ displayName, email, isAdmin }: Props) {
  const pathname = usePathname()

  return (
    <aside className="flex w-56 flex-col border-r border-zinc-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-zinc-200 px-5">
        <span className="text-lg font-bold tracking-tight text-zinc-900">
          Nexum
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-zinc-100 text-zinc-900'
                  : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User + Einstellungen */}
      <div className="border-t border-zinc-200 p-3 space-y-0.5">
        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname.startsWith('/admin')
                ? 'bg-violet-50 text-violet-700'
                : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
            )}
          >
            <Shield className="h-4 w-4 shrink-0" />
            Admin
          </Link>
        )}
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            pathname.startsWith('/settings')
              ? 'bg-zinc-100 text-zinc-900'
              : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          Einstellungen
        </Link>

        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Abmelden
          </button>
        </form>

        <div className="px-3 pt-2 pb-1">
          <p className="truncate text-xs font-medium text-zinc-900">{displayName}</p>
          <p className="truncate text-xs text-zinc-400">{email}</p>
        </div>
      </div>
    </aside>
  )
}
