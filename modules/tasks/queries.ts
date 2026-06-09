import { createClient } from '@/lib/supabase/server'
import type { ClientTask } from './types'

/**
 * Alle offenen Aufgaben (für globale Aufgabenliste).
 */
export async function getTasksByStatus(
  status: 'open' | 'completed' | 'all' = 'open'
): Promise<ClientTask[]> {
  const supabase = await createClient()

  let query = supabase
    .from('client_tasks')
    .select(`
      *,
      client:clients(id, display_label, personal_data),
      session:sessions(id, session_date)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('getTasksByStatus error:', error)
    return []
  }

  return (data ?? []) as ClientTask[]
}

/**
 * Aufgaben für eine bestimmte Sitzung.
 * Gibt 0 zurück wenn noch keine gespeichert wurden.
 */
export async function getTaskCountForSession(sessionId: string): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('client_tasks')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .is('deleted_at', null)

  if (error) return 0
  return count ?? 0
}

/**
 * Aufgaben für einen bestimmten Klienten.
 */
export async function getTasksForClient(
  clientId: string,
  status: 'open' | 'completed' | 'all' = 'open'
): Promise<ClientTask[]> {
  const supabase = await createClient()

  let query = supabase
    .from('client_tasks')
    .select(`*, session:sessions(id, session_date)`)
    .eq('client_id', clientId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('getTasksForClient error:', error)
    return []
  }

  return (data ?? []) as ClientTask[]
}
