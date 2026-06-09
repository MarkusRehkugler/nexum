import { createClient } from '@/lib/supabase/server'
import type { CalendarEntryWithClient } from './types'

/**
 * Gibt alle Termine für eine Woche zurück (inkl. Klient-Daten).
 * weekStart: ISO-Datum (YYYY-MM-DD) des Montags der Woche.
 */
export async function getCalendarEntriesForWeek(
  weekStart: string
): Promise<CalendarEntryWithClient[]> {
  const supabase = await createClient()

  // Wochenende = weekStart + 7 Tage
  const start = new Date(weekStart)
  start.setHours(0, 0, 0, 0)
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 7)
  end.setHours(23, 59, 59, 999)

  const { data, error } = await supabase
    .from('calendar_entries')
    .select(`
      *,
      client:clients(id, display_label, personal_data)
    `)
    .is('deleted_at', null)
    .gte('starts_at', start.toISOString())
    .lte('starts_at', end.toISOString())
    .order('starts_at', { ascending: true })

  if (error) {
    console.error('getCalendarEntriesForWeek error:', error)
    return []
  }

  return (data ?? []) as CalendarEntryWithClient[]
}

/**
 * Gibt einen einzelnen Termin zurück.
 */
export async function getCalendarEntryById(
  id: string
): Promise<CalendarEntryWithClient | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('calendar_entries')
    .select(`
      *,
      client:clients(id, display_label, personal_data)
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    console.error('getCalendarEntryById error:', error)
    return null
  }

  return data as CalendarEntryWithClient
}

/**
 * Gibt die nächsten N anstehenden Termine zurück (für Dashboard-Widget).
 */
export async function getUpcomingCalendarEntries(
  limit = 5
): Promise<CalendarEntryWithClient[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('calendar_entries')
    .select(`
      *,
      client:clients(id, display_label, personal_data)
    `)
    .is('deleted_at', null)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('getUpcomingCalendarEntries error:', error)
    return []
  }

  return (data ?? []) as CalendarEntryWithClient[]
}
