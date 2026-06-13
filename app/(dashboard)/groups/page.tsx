import Link from 'next/link'
import { Plus, Users, CalendarDays, ChevronRight, Clock } from 'lucide-react'
import { getGroupEvents } from '@/modules/calendar/queries'
import type { CalendarEntryWithClient } from '@/modules/calendar/types'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

function durationMin(starts: string, ends: string): number {
  return Math.round((new Date(ends).getTime() - new Date(starts).getTime()) / 60000)
}

function isPast(iso: string): boolean {
  return new Date(iso) < new Date()
}

function GroupCard({ event }: { event: CalendarEntryWithClient }) {
  const past = isPast(event.ends_at)
  const dur  = durationMin(event.starts_at, event.ends_at)

  return (
    <Link
      href={`/calendar/${event.id}`}
      className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white px-5 py-4 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all group"
    >
      {/* Icon */}
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${past ? 'bg-zinc-100' : 'bg-violet-100'}`}>
        <Users className={`h-5 w-5 ${past ? 'text-zinc-400' : 'text-violet-600'}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-semibold truncate ${past ? 'text-zinc-500' : 'text-zinc-900'}`}>
            {event.title}
          </p>
          {past && (
            <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
              Vergangen
            </span>
          )}
          {!past && (
            <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700">
              Anstehend
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {formatDate(event.starts_at)} · {formatTime(event.starts_at)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {dur} Min
          </span>
          {event.max_participants && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              max. {event.max_participants}
            </span>
          )}
        </div>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
    </Link>
  )
}

export default async function GroupsPage() {
  const events = await getGroupEvents()

  const upcoming = events.filter(e => !isPast(e.ends_at))
  const past     = events.filter(e => isPast(e.ends_at))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Gruppen & Kurse</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Gruppenveranstaltungen, Seminare und Kurstermine
          </p>
        </div>
        <Link
          href="/calendar/new"
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Neuer Termin
        </Link>
      </div>

      {/* Leer-Zustand */}
      {events.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-50">
            <Users className="h-6 w-6 text-violet-400" />
          </div>
          <p className="text-sm font-medium text-zinc-700">Noch keine Gruppenveranstaltungen</p>
          <p className="mt-1 text-xs text-zinc-400">
            Lege einen neuen Termin an und aktiviere den Schalter "Gruppenveranstaltung".
          </p>
          <Link
            href="/calendar/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ersten Termin anlegen
          </Link>
        </div>
      )}

      {/* Anstehend */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-3">
            Anstehend
          </h2>
          <div className="space-y-2">
            {upcoming.map(e => <GroupCard key={e.id} event={e} />)}
          </div>
        </section>
      )}

      {/* Vergangen */}
      {past.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-3">
            Vergangen
          </h2>
          <div className="space-y-2">
            {past.map(e => <GroupCard key={e.id} event={e} />)}
          </div>
        </section>
      )}
    </div>
  )
}
