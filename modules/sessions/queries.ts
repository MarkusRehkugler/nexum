import { createClient } from '@/lib/supabase/server'
import type { SessionWithClient } from './types'

export interface SessionFilters {
  type?: string
  clientId?: string
  month?: string  // 'YYYY-MM'
}

export async function getSessions(filters?: SessionFilters): Promise<SessionWithClient[]> {
  const supabase = await createClient()

  let query = supabase
    .from('sessions')
    .select(`
      *,
      case:cases (
        id,
        client_id,
        client:clients (
          id,
          display_label,
          personal_data
        )
      )
    `)
    .is('deleted_at', null)
    .order('session_date', { ascending: false })

  if (filters?.type) {
    query = query.eq('type', filters.type)
  }

  if (filters?.month) {
    const [year, mon] = filters.month.split('-').map(Number)
    const start = new Date(Date.UTC(year, mon - 1, 1)).toISOString()
    const end   = new Date(Date.UTC(year, mon, 1)).toISOString()
    query = query.gte('session_date', start).lt('session_date', end)
  }

  const { data, error } = await query

  if (error) {
    console.error('getSessions error:', error)
    return []
  }

  let sessions = (data ?? []) as unknown as SessionWithClient[]

  if (filters?.clientId) {
    sessions = sessions.filter(s => s.case?.client_id === filters.clientId)
  }

  return sessions
}

export async function getSessionById(id: string): Promise<SessionWithClient | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      case:cases (
        id,
        client_id,
        client:clients (
          id,
          display_label,
          personal_data
        )
      )
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    console.error('getSessionById error:', error)
    return null
  }

  return data as unknown as SessionWithClient
}
