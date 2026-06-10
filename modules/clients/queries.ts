import { createClient } from '@/lib/supabase/server'
import type { ClientRecord } from './types'

export interface JournalEntry {
  id: string
  type: 'appointment' | 'session' | 'invoice'
  date: string
  title: string
  subtitle: string | null
  href: string
  status?: string
}

export async function getClientJournal(clientId: string): Promise<JournalEntry[]> {
  const supabase = await createClient()

  const [
    { data: appointments },
    { data: clientCases },
    { data: invoices },
  ] = await Promise.all([
    supabase
      .from('calendar_entries')
      .select('id, title, start_at, duration_minutes, entry_type')
      .eq('client_id', clientId)
      .is('deleted_at', null),
    supabase
      .from('cases')
      .select('id')
      .eq('client_id', clientId)
      .is('deleted_at', null),
    supabase
      .from('invoices')
      .select('id, invoice_number, total_gross, status, issue_date, created_at')
      .eq('client_id', clientId)
      .is('deleted_at', null),
  ])

  const caseIds = (clientCases ?? []).map(c => c.id)

  let sessions: Array<{ id: string; session_date: string; type: string; status: string; duration_minutes: number | null }> = []
  if (caseIds.length > 0) {
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('id, session_date, type, status, duration_minutes, case_id')
      .in('case_id', caseIds)
      .is('deleted_at', null)
    sessions = (sessionData ?? []) as typeof sessions
  }

  const entries: JournalEntry[] = []

  for (const a of appointments ?? []) {
    entries.push({
      id:       a.id,
      type:     'appointment',
      date:     a.start_at,
      title:    a.title ?? 'Termin',
      subtitle: a.duration_minutes ? `${a.duration_minutes} min` : null,
      href:     `/calendar/${a.id}`,
    })
  }

  for (const s of sessions) {
    entries.push({
      id:       s.id,
      type:     'session',
      date:     s.session_date,
      title:    'Sitzung',
      subtitle: s.duration_minutes ? `${s.duration_minutes} min` : null,
      href:     `/sessions/${s.id}`,
      status:   s.status,
    })
  }

  for (const inv of invoices ?? []) {
    const gross = typeof inv.total_gross === 'number' ? inv.total_gross : null
    entries.push({
      id:       inv.id,
      type:     'invoice',
      date:     (inv.issue_date ?? inv.created_at) as string,
      title:    `Rechnung ${inv.invoice_number ?? ''}`.trim(),
      subtitle: gross !== null ? `${gross.toFixed(2)} €` : null,
      href:     `/invoices/${inv.id}`,
      status:   inv.status,
    })
  }

  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export async function getClients(): Promise<ClientRecord[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getClients error:', error)
    return []
  }

  return (data ?? []) as ClientRecord[]
}

export async function getClientById(id: string): Promise<ClientRecord | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    console.error('getClientById error:', error)
    return null
  }

  return data as ClientRecord
}
