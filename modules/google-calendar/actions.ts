'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CalendarConnection } from './types'

export async function getGoogleCalendarConnection(): Promise<CalendarConnection | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) return null

  const { data } = await supabase
    .from('calendar_connections')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .eq('provider', 'google')
    .is('deleted_at', null)
    .single()

  return (data as CalendarConnection) ?? null
}

export async function disconnectGoogleCalendarAction(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) return

  await supabase
    .from('calendar_connections')
    .update({ deleted_at: new Date().toISOString() })
    .eq('tenant_id', profile.tenant_id)
    .eq('provider', 'google')

  revalidatePath('/settings/calendar')
}
