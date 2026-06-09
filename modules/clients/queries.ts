import { createClient } from '@/lib/supabase/server'
import type { ClientRecord } from './types'

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
