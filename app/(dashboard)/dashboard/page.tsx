import Link from 'next/link'
import {
  Users, FileText, CalendarDays, Receipt,
  ListChecks, ArrowRight, TrendingUp, Clock,
  Play,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUpcomingCalendarEntries } from '@/modules/calendar/queries'

function formatEUR(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', {
    weekday: 'short', day: '2-digit', month: 'short',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Guten Morgen'
  if (h < 18) return 'Guten Tag'
  return 'Guten Abend'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('profile, tenant_id')
    .eq('id', user!.id)
    .single()

  const tenantId = profile?.tenant_id
  const name = (profile?.profile as { name?: string } | null)?.name ?? 'Coach'

  // Erster Tag des aktuellen Monats
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  // Alle KPIs + Daten parallel laden
  const [
    clientsRes,
    sessionsMonthRes,
    openTasksRes,
    invoicesDraftRes,
    recentSessionsRes,
    upcomingEntries,
  ] = await Promise.all([
    // Aktive Klienten
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .is('deleted_at', null),

    // Sitzungen diesen Monat
    supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('session_date', monthStart.toISOString())
      .is('deleted_at', null),

    // Offene Aufgaben
    supabase
      .from('client_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'open')
      .is('deleted_at', null),

    // Offene Rechnungen (Entwurf + Versendet) + Summe
    supabase
      .from('invoices')
      .select('total_gross')
      .eq('tenant_id', tenantId)
      .in('status', ['draft', 'sent'])
      .is('deleted_at', null),

    // Letzte 4 Sitzungen mit Klientenname
    supabase
      .from('sessions')
      .select(`
        id, session_date, type, status,
        case:cases(
          client:clients(display_label, personal_data)
        )
      `)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('session_date', { ascending: false })
      .limit(4),

    // Nächste 5 Termine
    getUpcomingCalendarEntries(5),
  ])

  const activeClients   = clientsRes.count ?? 0
  const sessionsMonth   = sessionsMonthRes.count ?? 0
  const openTasks       = openTasksRes.count ?? 0
  const openInvoices    = invoicesDraftRes.data ?? []
  const openInvoiceTotal = openInvoices.reduce((s, r) => s + Number(r.total_gross), 0)
  const openInvoiceCount = openInvoices.length
  const recentSessions  = recentSessionsRes.data ?? []

  const isNewUser = activeClients === 0

  const today = new Date().toLocaleDateString('de-DE', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })

  const stats = [
    {
      label: 'Aktive Klienten',
      value: activeClients,
      sub: 'gesamt',
      icon: Users,
      href: '/clients',
      color: 'text-violet-600 bg-violet-50',
    },
    {
      label: 'Sitzungen',
      value: sessionsMonth,
      sub: 'diesen Monat',
      icon: FileText,
      href: '/sessions',
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Offene Aufgaben',
      value: openTasks,
      sub: openTasks === 1 ? 'Aufgabe offen' : 'Aufgaben offen',
      icon: ListChecks,
      href: '/tasks',
      color: openTasks > 0 ? 'text-amber-600 bg-amber-50' : 'text-zinc-400 bg-zinc-50',
    },
    {
      label: 'Offene Rechnungen',
      value: formatEUR(openInvoiceTotal),
      sub: openInvoiceCount === 0
        ? 'keine offen'
        : `${openInvoiceCount} ${openInvoiceCount === 1 ? 'Rechnung' : 'Rechnungen'}`,
      icon: Receipt,
      href: '/invoices',
      color: openInvoiceCount > 0 ? 'text-green-600 bg-green-50' : 'text-zinc-400 bg-zinc-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            {greeting()}, {name} 👋
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500 capitalize">{today}</p>
        </div>
        <Link
          href="/sessions/new"
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-700 transition-colors"
        >
          <Play className="h-4 w-4" />
          Sitzung starten
        </Link>
      </div>

      {/* KPI-Karten */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ label, value, sub, icon: Icon, href, color }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xl font-bold text-zinc-900 tabular-nums">{value}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
              <p className="text-xs text-zinc-400">{sub}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Nächste Termine */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <CalendarDays className="h-4 w-4 text-zinc-400" />
              Nächste Termine
            </h2>
            <Link href="/calendar" className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700">
              Alle <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {upcomingEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-zinc-400">Keine anstehenden Termine</p>
              <Link href="/calendar/new" className="mt-2 text-xs text-zinc-500 underline hover:text-zinc-800">
                Termin anlegen
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {upcomingEntries.map((entry) => {
                const clientName =
                  entry.client?.personal_data?.name ?? entry.client?.display_label
                return (
                  <li key={entry.id}>
                    <Link
                      href={`/calendar/${entry.id}`}
                      className="flex items-center gap-3 rounded-lg p-2 hover:bg-zinc-50 transition-colors group"
                    >
                      <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                        <span className="text-[10px] font-semibold leading-none">
                          {new Date(entry.starts_at).toLocaleDateString('de-DE', { day: '2-digit' })}
                        </span>
                        <span className="text-[10px] leading-none opacity-70">
                          {new Date(entry.starts_at).toLocaleDateString('de-DE', { month: 'short' })}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-900 group-hover:text-violet-700">
                          {entry.title}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {formatTime(entry.starts_at)}
                          {clientName && ` · ${clientName}`}
                        </p>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Letzte Sitzungen */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <Clock className="h-4 w-4 text-zinc-400" />
              Letzte Sitzungen
            </h2>
            <Link href="/sessions" className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700">
              Alle <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {recentSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-zinc-400">Noch keine Sitzungen</p>
              <Link href="/sessions/new" className="mt-2 text-xs text-zinc-500 underline hover:text-zinc-800">
                Erste Sitzung anlegen
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {recentSessions.map((s: any) => {
                const clientName =
                  s.case?.client?.personal_data?.name ?? s.case?.client?.display_label ?? '—'
                return (
                  <li key={s.id}>
                    <Link
                      href={`/sessions/${s.id}`}
                      className="flex items-center gap-3 rounded-lg p-2 hover:bg-zinc-50 transition-colors group"
                    >
                      <div className={`flex h-2 w-2 shrink-0 rounded-full ${
                        s.status === 'completed' ? 'bg-green-500'
                        : s.status === 'billed' ? 'bg-blue-500'
                        : 'bg-yellow-400'
                      }`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-900 group-hover:text-violet-700">
                          {clientName}
                        </p>
                        <p className="text-xs text-zinc-400">{formatDate(s.session_date)}</p>
                      </div>
                      {s.status === 'draft' && (
                        <span className="shrink-0 text-[10px] font-medium text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded-full">
                          Entwurf
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Onboarding — nur für neue Nutzer */}
      {isNewUser && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-violet-500" />
            <div className="flex-1">
              <h2 className="font-semibold text-zinc-900">In 15 Minuten zum ersten KI-Protokoll</h2>
              <p className="mt-0.5 text-sm text-zinc-500">
                Folge diesen Schritten für den Aha-Moment.
              </p>
              <ol className="mt-4 space-y-3">
                {[
                  { step: 1, label: 'Ersten Klienten anlegen', href: '/clients/new' },
                  { step: 2, label: 'Einwilligung dokumentieren', href: '/clients' },
                  { step: 3, label: 'Termin buchen', href: '/calendar/new' },
                  { step: 4, label: 'Sitzung aufnehmen + Transkribieren', href: '/sessions/new' },
                  { step: 5, label: 'KI-Protokoll generieren', href: '/sessions' },
                  { step: 6, label: 'Rechnung erstellen', href: '/invoices/new' },
                ].map(({ step, label, href }) => (
                  <li key={step} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-500">
                      {step}
                    </span>
                    <Link
                      href={href}
                      className="flex items-center gap-1 text-sm text-zinc-700 hover:text-zinc-900 hover:underline"
                    >
                      {label}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
