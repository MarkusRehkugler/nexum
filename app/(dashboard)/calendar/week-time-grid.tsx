'use client'

import Link from 'next/link'
import { Plus, Video, Users } from 'lucide-react'
import type { CalendarEntryWithClient } from '@/modules/calendar/types'

// ── Konstanten ──────────────────────────────────────────────────────────────
const HOUR_START   = 7     // Grid-Beginn 07:00
const HOUR_END     = 20    // Grid-Ende   20:00
const HOURS        = HOUR_END - HOUR_START
const PX_PER_HOUR  = 64   // px pro Stunde
const PX_PER_MIN   = PX_PER_HOUR / 60
const TOTAL_HEIGHT = HOURS * PX_PER_HOUR  // 832px

// ── Hilfsfunktionen ─────────────────────────────────────────────────────────
function topPx(isoTime: string): number {
  const d = new Date(isoTime)
  const min = d.getHours() * 60 + d.getMinutes() - HOUR_START * 60
  return Math.max(0, Math.min(min * PX_PER_MIN, TOTAL_HEIGHT))
}

function heightPx(starts: string, ends: string): number {
  const dur = Math.round((new Date(ends).getTime() - new Date(starts).getTime()) / 60000)
  return Math.max(26, dur * PX_PER_MIN)
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

function isToday(dateStr: string): boolean {
  const today = new Date()
  const d = new Date(dateStr + 'T00:00:00')
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  )
}

function currentTimeTopPx(): number {
  const now = new Date()
  const min = now.getHours() * 60 + now.getMinutes() - HOUR_START * 60
  return Math.max(0, Math.min(min * PX_PER_MIN, TOTAL_HEIGHT))
}

// ── Überlappungs-Layout ──────────────────────────────────────────────────────
interface LayoutEntry {
  entry: CalendarEntryWithClient
  slot: number
  totalSlots: number
}

function computeLayout(entries: CalendarEntryWithClient[]): LayoutEntry[] {
  const sorted = [...entries].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  )

  const slotEndTimes: number[] = []
  const slots: number[] = []

  for (const entry of sorted) {
    const start = new Date(entry.starts_at).getTime()
    const end   = new Date(entry.ends_at).getTime()
    let slot    = slotEndTimes.findIndex((t) => t <= start)
    if (slot === -1) { slot = slotEndTimes.length; slotEndTimes.push(end) }
    else slotEndTimes[slot] = end
    slots.push(slot)
  }

  return sorted.map((entry, i) => {
    const start = new Date(entry.starts_at).getTime()
    const end   = new Date(entry.ends_at).getTime()
    const maxSlot = sorted.reduce((max, other, j) => {
      const os = new Date(other.starts_at).getTime()
      const oe = new Date(other.ends_at).getTime()
      return os < end && oe > start ? Math.max(max, slots[j]) : max
    }, 0)
    return { entry, slot: slots[i], totalSlots: maxSlot + 1 }
  })
}

// ── Farben je Typ ────────────────────────────────────────────────────────────
function entryColors(entry: CalendarEntryWithClient) {
  const linked = entry.session_id !== null
  if (entry.type === 'session' || linked) {
    return {
      bg:     'bg-violet-100 hover:bg-violet-200',
      border: 'border-l-[3px] border-violet-500',
      text:   'text-violet-900',
      sub:    'text-violet-600',
    }
  }
  if (entry.type === 'block') {
    return {
      bg:     'bg-zinc-100 hover:bg-zinc-200',
      border: 'border-l-[3px] border-zinc-400',
      text:   'text-zinc-700',
      sub:    'text-zinc-500',
    }
  }
  if (entry.type === 'reminder') {
    return {
      bg:     'bg-amber-50 hover:bg-amber-100',
      border: 'border-l-[3px] border-amber-400',
      text:   'text-amber-900',
      sub:    'text-amber-600',
    }
  }
  // event (default)
  return {
    bg:     'bg-blue-50 hover:bg-blue-100',
    border: 'border-l-[3px] border-blue-500',
    text:   'text-blue-900',
    sub:    'text-blue-600',
  }
}

// ── Props ────────────────────────────────────────────────────────────────────
interface Props {
  days: string[]  // YYYY-MM-DD, 7 Tage
  entriesByDay: CalendarEntryWithClient[][]
}

// ── Hauptkomponente ──────────────────────────────────────────────────────────
export function WeekTimeGrid({ days, entriesByDay }: Props) {
  const todayTop = currentTimeTopPx()
  const todayIdx = days.findIndex((d) => isToday(d))

  const hours = Array.from({ length: HOURS + 1 }, (_, i) => HOUR_START + i)

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex min-w-[640px]">
        {/* Stunden-Leiste */}
        <div className="relative w-14 shrink-0 border-r border-zinc-100" style={{ height: TOTAL_HEIGHT }}>
          {hours.map((h) => (
            <div
              key={h}
              className="absolute left-0 right-0 flex items-center pr-2"
              style={{ top: (h - HOUR_START) * PX_PER_HOUR - 8 }}
            >
              <span className="w-full text-right text-[10px] text-zinc-400 font-medium tabular-nums">
                {h < HOUR_END ? `${String(h).padStart(2, '0')}:00` : ''}
              </span>
            </div>
          ))}
        </div>

        {/* Tages-Spalten */}
        {days.map((dateStr, colIdx) => {
          const today = isToday(dateStr)
          const dayEntries = entriesByDay[colIdx]
          const layout = computeLayout(dayEntries)

          return (
            <div
              key={dateStr}
              className={`relative flex-1 border-r border-zinc-100 last:border-r-0 ${today ? 'bg-violet-50/30' : ''}`}
              style={{ height: TOTAL_HEIGHT }}
            >
              {/* Stundenraster */}
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-zinc-100"
                  style={{ top: (h - HOUR_START) * PX_PER_HOUR }}
                />
              ))}

              {/* 30-min Halbraster (heller) */}
              {hours.slice(0, -1).map((h) => (
                <div
                  key={`${h}-half`}
                  className="absolute left-0 right-0 border-t border-zinc-50"
                  style={{ top: (h - HOUR_START) * PX_PER_HOUR + PX_PER_HOUR / 2 }}
                />
              ))}

              {/* Jetzt-Linie */}
              {today && (
                <div
                  className="absolute left-0 right-0 z-20 border-t-2 border-red-400"
                  style={{ top: todayTop }}
                >
                  <div className="absolute -left-1 -top-1.5 h-3 w-3 rounded-full bg-red-400" />
                </div>
              )}

              {/* Termine */}
              {layout.map(({ entry, slot, totalSlots }) => {
                const top    = topPx(entry.starts_at)
                const height = heightPx(entry.starts_at, entry.ends_at)
                const w      = 100 / totalSlots
                const left   = (slot / totalSlots) * 100
                const colors = entryColors(entry)
                const linked = entry.session_id !== null
                const clientName =
                  entry.client?.personal_data?.name ?? entry.client?.display_label

                return (
                  <Link
                    key={entry.id}
                    href={`/calendar/${entry.id}`}
                    className={`absolute z-10 overflow-hidden rounded-r-md transition-all ${colors.bg} ${colors.border}`}
                    style={{
                      top:    top + 1,
                      height: height - 2,
                      left:   `calc(${left}% + 2px)`,
                      width:  `calc(${w}% - 4px)`,
                    }}
                  >
                    <div className="flex h-full flex-col px-1.5 py-1 leading-tight overflow-hidden">
                      <div className="flex items-center gap-1">
                        {linked && <Video className="h-2.5 w-2.5 shrink-0 text-violet-500" />}
                        {entry.is_group_event && <Users className="h-2.5 w-2.5 shrink-0 text-violet-400" />}
                        <span className={`truncate text-[10px] font-semibold ${colors.text}`}>
                          {entry.title}
                        </span>
                      </div>
                      {height > 36 && (
                        <span className={`truncate text-[9px] ${colors.sub}`}>
                          {formatTime(entry.starts_at)}
                          {entry.is_group_event
                            ? ' · Gruppe'
                            : clientName ? ` · ${clientName}` : ''}
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })}

              {/* Klick auf leere Fläche → neuer Termin */}
              <Link
                href={`/calendar/new?date=${dateStr}`}
                className="absolute inset-0 z-0"
                aria-label={`Termin am ${dateStr} anlegen`}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
