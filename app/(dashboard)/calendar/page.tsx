import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react'
import { getCalendarEntriesForWeek } from '@/modules/calendar/queries'
import { WeekTimeGrid } from './week-time-grid'

interface Props {
  searchParams: Promise<{ week?: string }>
}

function getMondayOf(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0)
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function formatWeekLabel(monday: Date): string {
  const sunday = addDays(monday, 6)
  const mStr = monday.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })
  const sStr = sunday.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
  return `${mStr} – ${sStr}`
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function isToday(d: Date): boolean {
  return isSameDay(d, new Date())
}

export default async function CalendarPage({ searchParams }: Props) {
  const { week } = await searchParams

  const monday = week ? getMondayOf(parseLocalDate(week)) : getMondayOf(new Date())
  const mondayStr    = toDateStr(monday)
  const prevWeekStr  = toDateStr(addDays(monday, -7))
  const nextWeekStr  = toDateStr(addDays(monday, 7))
  const todayMondayStr = toDateStr(getMondayOf(new Date()))

  const entries = await getCalendarEntriesForWeek(mondayStr)
  const days    = Array.from({ length: 7 }, (_, i) => addDays(monday, i))
  const dayStrs = days.map(toDateStr)

  const entriesByDay = days.map((day) =>
    entries.filter((e) => isSameDay(new Date(e.starts_at), day))
  )

  const totalEntries  = entries.length
  const isCurrentWeek = mondayStr === todayMondayStr

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Kalender</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {totalEntries === 0
              ? 'Keine Termine diese Woche'
              : `${totalEntries} Termin${totalEntries !== 1 ? 'e' : ''} diese Woche`}
          </p>
        </div>
        <Link
          href="/calendar/new"
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Termin anlegen
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        {!isCurrentWeek && (
          <Link
            href={`/calendar?week=${todayMondayStr}`}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-300 transition-colors"
          >
            Heute
          </Link>
        )}
        <Link
          href={`/calendar?week=${prevWeekStr}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-900 transition-colors"
          aria-label="Vorherige Woche"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <span className="min-w-52 text-center text-sm font-medium text-zinc-900">
          {formatWeekLabel(monday)}
        </span>
        <Link
          href={`/calendar?week=${nextWeekStr}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-900 transition-colors"
          aria-label="Nächste Woche"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Tag-Header */}
      <div className="flex min-w-[640px] overflow-x-auto">
        <div className="w-14 shrink-0" /> {/* Stunden-Spalte Platzhalter */}
        {days.map((day, i) => {
          const today   = isToday(day)
          const dateStr = dayStrs[i]
          return (
            <div key={dateStr} className="flex-1 px-2 pb-2">
              <div className={`rounded-lg px-2 py-1.5 text-center ${today ? 'bg-violet-50' : ''}`}>
                <p className={`text-[10px] font-semibold uppercase tracking-wide ${today ? 'text-violet-500' : 'text-zinc-400'}`}>
                  {day.toLocaleDateString('de-DE', { weekday: 'short' })}
                </p>
                <p className={`text-lg font-bold leading-tight ${today ? 'text-violet-700' : 'text-zinc-900'}`}>
                  {day.getDate()}
                </p>
                <p className={`text-[10px] ${today ? 'text-violet-400' : 'text-zinc-400'}`}>
                  {day.toLocaleDateString('de-DE', { month: 'short' })}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Zeitraster */}
      <WeekTimeGrid days={dayStrs} entriesByDay={entriesByDay} />

      {/* Legende */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 pt-1">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm border-l-2 border-violet-500 bg-violet-100" />
          Sitzung / Sitzungs-Termin
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm border-l-2 border-blue-500 bg-blue-50" />
          Freier Termin
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm border-l-2 border-zinc-400 bg-zinc-100" />
          Geblockt
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm border-l-2 border-amber-400 bg-amber-50" />
          Erinnerung
        </span>
        {totalEntries === 0 && (
          <span className="ml-auto flex items-center gap-1.5 text-zinc-400">
            <Calendar className="h-3.5 w-3.5" />
            Klicke in das Raster um einen Termin anzulegen
          </span>
        )}
      </div>
    </div>
  )
}
