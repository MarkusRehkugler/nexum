import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react'
import { getCalendarEntriesForWeek } from '@/modules/calendar/queries'
import { TYPE_LABELS, TYPE_COLORS } from '@/modules/calendar/schemas'

interface Props {
  searchParams: Promise<{ week?: string }>
}

// Gibt den Montag der Woche zurück, in der `date` liegt
function getMondayOf(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

// YYYY-MM-DD → Date (ohne Timezone-Shift)
function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0)
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function formatDayHeader(d: Date): string {
  return d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })
}

function formatWeekLabel(monday: Date): string {
  const sunday = addDays(monday, 6)
  const mStr = monday.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })
  const sStr = sunday.toLocaleDateString('de-DE', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
  return `${mStr} – ${sStr}`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

function durationLabel(startsAt: string, endsAt: string): string {
  const mins = Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60000)
  if (mins < 60) return `${mins} Min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h} Std ${m} Min` : `${h} Std`
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isToday(d: Date): boolean {
  return isSameDay(d, new Date())
}

export default async function CalendarPage({ searchParams }: Props) {
  const { week } = await searchParams

  // Wochenbeginn bestimmen
  const monday = week
    ? getMondayOf(parseLocalDate(week))
    : getMondayOf(new Date())

  const mondayStr = toDateStr(monday)
  const prevWeekStr = toDateStr(addDays(monday, -7))
  const nextWeekStr = toDateStr(addDays(monday, 7))
  const todayMondayStr = toDateStr(getMondayOf(new Date()))

  // Termine laden
  const entries = await getCalendarEntriesForWeek(mondayStr)

  // Tage der Woche (Mo–So)
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i))

  // Termine nach Tag gruppieren
  const entriesByDay = days.map((day) =>
    entries.filter((e) => isSameDay(new Date(e.starts_at), day))
  )

  const totalEntries = entries.length
  const isCurrentWeek = mondayStr === todayMondayStr

  return (
    <div className="space-y-6">
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

      {/* Wochennavigation */}
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

      {/* Wochenansicht */}
      <div className="grid grid-cols-7 gap-3">
        {days.map((day, i) => {
          const dayEntries = entriesByDay[i]
          const today = isToday(day)
          const dateStr = toDateStr(day)

          return (
            <div
              key={dateStr}
              className={`rounded-xl border bg-white ${
                today ? 'border-violet-300 shadow-sm shadow-violet-100' : 'border-zinc-200'
              }`}
            >
              {/* Tag-Header */}
              <div
                className={`rounded-t-xl border-b px-3 py-2.5 ${
                  today ? 'border-violet-200 bg-violet-50' : 'border-zinc-100 bg-zinc-50'
                }`}
              >
                <p
                  className={`text-xs font-semibold uppercase tracking-wide ${
                    today ? 'text-violet-600' : 'text-zinc-400'
                  }`}
                >
                  {day.toLocaleDateString('de-DE', { weekday: 'short' })}
                </p>
                <p
                  className={`text-lg font-bold leading-tight ${
                    today ? 'text-violet-700' : 'text-zinc-900'
                  }`}
                >
                  {day.getDate()}
                </p>
              </div>

              {/* Termine */}
              <div className="p-2 space-y-1.5 min-h-[80px]">
                {dayEntries.length === 0 ? (
                  <Link
                    href={`/calendar/new?date=${dateStr}`}
                    className="flex h-full min-h-[60px] items-center justify-center rounded-lg text-zinc-300 hover:bg-zinc-50 hover:text-zinc-400 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </Link>
                ) : (
                  dayEntries.map((entry) => {
                    const tc = TYPE_COLORS[entry.type] ?? TYPE_COLORS.event
                    const clientName =
                      entry.client?.personal_data?.name ?? entry.client?.display_label
                    return (
                      <Link
                        key={entry.id}
                        href={`/calendar/${entry.id}`}
                        className="block rounded-lg border border-zinc-100 bg-zinc-50 p-2 hover:border-zinc-200 hover:bg-white transition-all group"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`inline-block h-1.5 w-1.5 rounded-full ${
                              entry.type === 'session'
                                ? 'bg-violet-500'
                                : entry.type === 'block'
                                ? 'bg-zinc-400'
                                : 'bg-blue-500'
                            }`}
                          />
                          <span className="text-[10px] font-medium text-zinc-400">
                            {formatTime(entry.starts_at)}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-zinc-900 leading-snug line-clamp-2 group-hover:text-violet-700 transition-colors">
                          {entry.title}
                        </p>
                        {clientName && (
                          <p className="mt-0.5 text-[10px] text-zinc-400 truncate">
                            {clientName}
                          </p>
                        )}
                        <p className="mt-1 text-[10px] text-zinc-400">
                          {durationLabel(entry.starts_at, entry.ends_at)}
                        </p>
                      </Link>
                    )
                  })
                )}

                {/* Termin hinzufügen — wenn bereits Termine da */}
                {dayEntries.length > 0 && (
                  <Link
                    href={`/calendar/new?date=${dateStr}`}
                    className="flex items-center justify-center rounded-lg py-1 text-zinc-300 hover:bg-zinc-50 hover:text-zinc-400 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Wenn Woche komplett leer */}
      {totalEntries === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white py-16 text-center">
          <Calendar className="mx-auto h-10 w-10 text-zinc-300" />
          <h3 className="mt-4 text-sm font-medium text-zinc-900">Keine Termine diese Woche</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Klicke auf den <strong>+</strong> in einem Tag oder lege einen neuen Termin an.
          </p>
          <Link
            href="/calendar/new"
            className="mt-4 flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ersten Termin anlegen
          </Link>
        </div>
      )}
    </div>
  )
}
