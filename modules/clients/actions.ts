'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClientSchema } from './schemas'

export type CreateClientState = {
  errors?: {
    name?: string[]
    email?: string[]
    phone?: string[]
    notes?: string[]
    general?: string[]
  }
}

export async function createClientAction(
  _prevState: CreateClientState,
  formData: FormData
): Promise<CreateClientState> {
  const raw = {
    name: formData.get('name') as string,
    email: (formData.get('email') as string) || undefined,
    phone: (formData.get('phone') as string) || undefined,
    notes: (formData.get('notes') as string) || undefined,
  }

  const result = createClientSchema.safeParse(raw)
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors }
  }

  const { name, email, phone, notes } = result.data

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { errors: { general: ['Nicht authentifiziert.'] } }
  }

  // Tenant-ID aus User-Profil lesen
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return { errors: { general: ['Kein Mandant gefunden.'] } }
  }

  const personal_data: Record<string, string> = { name }
  if (email) personal_data.email = email
  if (phone) personal_data.phone = phone
  if (notes) personal_data.notes = notes

  const { error } = await supabase.from('clients').insert({
    tenant_id: profile.tenant_id,
    assigned_user_id: user.id,
    display_label: name,          // MVP: plain name; später pseudonymisiert
    personal_data,
    status: 'active',
  })

  if (error) {
    console.error('createClient error:', error)
    return { errors: { general: ['Klient konnte nicht angelegt werden.'] } }
  }

  redirect('/clients')
}

export async function archiveClientAction(clientId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('clients')
    .update({ status: 'archived', deleted_at: new Date().toISOString() })
    .eq('id', clientId)

  if (error) {
    console.error('archiveClient error:', error)
    return { error: 'Klient konnte nicht archiviert werden.' }
  }

  return {}
}
