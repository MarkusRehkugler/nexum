import { createClient } from '@/lib/supabase/server'
import type { TenantProfile, ServiceItem } from './types'

export async function getTenantProfile(): Promise<TenantProfile | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tenant_profiles')
    .select('*')
    .maybeSingle()
  return data as TenantProfile | null
}

export async function getServiceItems(): Promise<ServiceItem[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('service_items')
    .select('*')
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  return (data ?? []) as ServiceItem[]
}

export async function getServiceItemById(id: string): Promise<ServiceItem | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('service_items')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()
  return data as ServiceItem | null
}
