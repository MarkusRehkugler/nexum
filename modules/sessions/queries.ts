import { createClient } from '@/lib/supabase/server'
import type { SessionWithClient } from './types'

export async function getSessions(): Promise<SessionWithClient[]> {
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
    .is('deleted_at', null)
    .order('session_date', { ascending: false })

  if (error) {
    console.error('getSessions error:', error)
    return []
  }

  return (data ?? []) as unknown as SessionWithClient[]
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
