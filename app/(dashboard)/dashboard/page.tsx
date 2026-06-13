import Link from 'next/link'
import {
  Users, FileText, CalendarDays, Receipt,
  ListChecks, ArrowRight, Clock,
  Play, CheckCircle2, Circle, Video,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUpcomingCalendarEntries, getTodayCalendarEntries } from '@/modules/calendar/queries'

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

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const [
    clientsRes,
    sessionsMonthRes,
    openTasksRes,
    invoicesDraftRes,
    recentSessionsRes,
    upcomingEntries,
    todayEntries,
    totalSessionsRes,
    totalInvoicesRes,
    aiProtocolsRes,
    tenantProfileRes,
  ] = await Promise.all([
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .is('deleted_at', null),

    supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('session_date', monthStart.toISOString())
      .is('deleted_at', null),

    supabase
      .from('client_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'open')
      .is('deleted_at', null),

    supabase
      .from('invoices')
      .select('total_gross')
      .eq('tenant_id', tenantId)
      .in('status', ['draft', 'sent'])
      .is('deleted_at', null),

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

    getUpcomingCalendarEntries(5),
    getTodayCalendarEntries(),

    // Onboarding-Daten
    supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null),

    supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null),

    supabase
      .from('ai_session_results')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null),

    supabase
      .from('tenant_profiles')
      .select('company_name, owner_name')
      .eq('tenant_id', tenantId)
      .maybeSingle(),
  ])

  const activeClients    = clientsRes.count ?? 0
  const sessionsMonth    = sessionsMonthRes.count ?? 0
  const openTasks        = openTasksRes.count ?? 0
  const openInvoices     = invoicesDraftRes.data ?? []
  const openInvoiceTotal = openInvoices.reduce((s, r) => s + Number(r.total_gross), 0)
  const openInvoiceCount = openInvoices.length
  const recentSessions   = recentSessionsRes.data ?? []
  const totalSessions    = totalSessionsRes.count ?? 0
  const totalInvoices    = totalInvoicesRes.count ?? 0
  const aiProtocols      = aiProtocolsRes.count ?? 0
  const tenantProfile    = tenantProfileRes.data

  // Onboarding-Schritte
  const hasProfile   = !!(tenantProfile?.company_name || tenantProfile?.owner_name)
  const hasClient    = activeClients > 0
  const hasSession   = totalSessions > 0
  const hasProtocol  = aiProtocols > 0
  const hasInvoice   = totalInvoices > 0

  const onboardingSteps = [
    { done: hasProfile,  label: 'Praxisprofil einrichten',      href: '/settings' },
    { done: hasClient,   label: 'Ersten Klienten anlegen',       href: '/clients/new' },
    { done: hasSession,  label: 'Erste Sitzung dokumentieren',   href: '/sessions/new' },
    { done: hasProtocol, label: 'KI-Protokoll generieren',       href: '/sessions' },
    { done: hasInvoice,  label: 'Erste Rechnung erstellen',      href: '/invoices/new' },
  ]
  const doneCount    = onboardingSteps.filter(s => s.done).length
  const allDone      = doneCount === onboardingSteps.length
  const showOnboarding = !allDone

  const today = new Date().toLocaleDateString('de-DE', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })

  // Heute-Einträge: keine Blocker-Einträge zeigen
  const relevantTodayEntries = todayEntries.filter(e => e.type !== 'block')

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
            {greeting()}, {name}
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

      {/* Heute */}
      {relevantTodayEntries.length > 0 && (
        <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-violet-900">
              <CalendarDays className="h-4 w-4 text-violet-500" />
              Heute
            </h2>
            <Link href="/calendar" className="flex items-center gap-1 text-xs text-violet-500 hover:text-violet-800">
              Kalender <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="space-y-2">
            {relevantTodayEntries.map(entry => {
              const clientName =
                entry.client?.personal_data?.name ?? entry.client?.display_label
              const isSession = entry.type === 'session'
              const linked    = entry.session_id !== null

              let cta: { label: string; href: string } | null = null
              if (isSession && linked) {
                cta = { label: 'Zur Sitzung', href: `/sessions/${entry.session_id}` }
              } else if (isSession && !linked) {
                cta = {
                  label: 'Sitzung starten',
                  href: `/sessions/new${entry.client?.id ? `?clientId=${entry.client.id}` : ''}`,
                }
              }

              return (
                <li key={entry.id} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-white border border-violet-100 shadow-sm">
                    <span className="text-xs font-bold text-violet-700 leading-none">
                      {formatTime(entry.starts_at)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {linked && <Video className="h-3 w-3 text-violet-400 shrink-0" />}
                      <p className="truncate text-sm font-medium text-zinc-900">{entry.title}</p>
                    </div>
                    {clientName && (
                      <p className="text-xs text-zinc-500">{clientName}</p>
                    )}
                  </div>
                  {cta ? (
                    <Link
                      href={cta.href}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        linked
                          ? 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                          : 'bg-violet-600 text-white hover:bg-violet-700'
                      }`}
                    >
                      {cta.label}
                    </Link>
                  ) : (
                    <Link
                      href={`/calendar/${entry.id}`}
                      className="shrink-0 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                    >
                      Öffnen
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}

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

      {/* Onboarding-Checklist */}
      {showOnboarding && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-semibold text-zinc-900">Erste Schritte</h2>
              <p className="mt-0.5 text-sm text-zinc-500">
                {doneCount} von {onboardingSteps.length} Schritten erledigt
              </p>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {onboardingSteps.map((s, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-6 rounded-full transition-colors ${s.done ? 'bg-violet-500' : 'bg-zinc-200'}`}
                />
              ))}
            </div>
          </div>
          <ul className="space-y-2">
            {onboardingSteps.map(({ done, label, href }) => (
              <li key={label} className="flex items-center gap-3">
                {done ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-zinc-300" />
                )}
                {done ? (
                  <span className="text-sm text-zinc-400 line-through">{label}</span>
                ) : (
                  <Link
                    href={href}
                    className="flex items-center gap-1 text-sm text-zinc-700 hover:text-zinc-900 hover:underline"
                  >
                    {label}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
