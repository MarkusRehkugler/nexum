'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClientSchema } from './schemas'

export type CreateClientState = {
  errors?: {
    last_name?: string[]
    first_name?: string[]
    email?: string[]
    phone_mobile?: string[]
    general?: string[]
  }
}

export async function createClientAction(
  _prevState: CreateClientState,
  formData: FormData
): Promise<CreateClientState> {
  const raw = {
    salutation:              (formData.get('salutation') as string) || undefined,
    first_name:              (formData.get('first_name') as string) || undefined,
    last_name:               formData.get('last_name') as string,
    birth_date:              (formData.get('birth_date') as string) || undefined,
    email:                   (formData.get('email') as string) || undefined,
    phone_mobile:            (formData.get('phone_mobile') as string) || undefined,
    phone_landline:          (formData.get('phone_landline') as string) || undefined,
    emergency_contact_name:  (formData.get('emergency_contact_name') as string) || undefined,
    emergency_contact_phone: (formData.get('emergency_contact_phone') as string) || undefined,
    notes:                   (formData.get('notes') as string) || undefined,
  }

  const result = createClientSchema.safeParse(raw)
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors }
  }

  const {
    salutation, first_name, last_name, birth_date,
    email, phone_mobile, phone_landline,
    emergency_contact_name, emergency_contact_phone, notes,
  } = result.data

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { errors: { general: ['Nicht authentifiziert.'] } }
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return { errors: { general: ['Kein Mandant gefunden.'] } }
  }

  const displayName = [first_name, last_name].filter(Boolean).join(' ')

  const personal_data: Record<string, string> = {
    name:      displayName,   // backward-compat for all existing queries
    last_name,
  }
  if (salutation)              personal_data.salutation = salutation
  if (first_name)              personal_data.first_name = first_name
  if (birth_date)              personal_data.birth_date = birth_date
  if (email)                   personal_data.email = email
  if (phone_mobile)            personal_data.phone_mobile = phone_mobile
  if (phone_landline)          personal_data.phone_landline = phone_landline
  if (emergency_contact_name)  personal_data.emergency_contact_name = emergency_contact_name
  if (emergency_contact_phone) personal_data.emergency_contact_phone = emergency_contact_phone
  if (notes)                   personal_data.notes = notes

  const { error } = await supabase.from('clients').insert({
    tenant_id:        profile.tenant_id,
    assigned_user_id: user.id,
    display_label:    displayName,
    personal_data,
    status:           'active',
  })

  if (error) {
    console.error('createClient error:', error)
    return { errors: { general: ['Klient konnte nicht angelegt werden.'] } }
  }

  redirect('/clients')
}

export type UpdateClientState = {
  errors?: {
    last_name?: string[]
    first_name?: string[]
    email?: string[]
    phone_mobile?: string[]
    general?: string[]
  }
  success?: boolean
}

export async function updateClientAction(
  clientId: string,
  _prevState: UpdateClientState,
  formData: FormData
): Promise<UpdateClientState> {
  const raw = {
    salutation:              (formData.get('salutation') as string) || undefined,
    first_name:              (formData.get('first_name') as string) || undefined,
    last_name:               formData.get('last_name') as string,
    birth_date:              (formData.get('birth_date') as string) || undefined,
    email:                   (formData.get('email') as string) || undefined,
    phone_mobile:            (formData.get('phone_mobile') as string) || undefined,
    phone_landline:          (formData.get('phone_landline') as string) || undefined,
    emergency_contact_name:  (formData.get('emergency_contact_name') as string) || undefined,
    emergency_contact_phone: (formData.get('emergency_contact_phone') as string) || undefined,
    notes:                   (formData.get('notes') as string) || undefined,
  }

  const result = createClientSchema.safeParse(raw)
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors }
  }

  const {
    salutation, first_name, last_name, birth_date,
    email, phone_mobile, phone_landline,
    emergency_contact_name, emergency_contact_phone, notes,
  } = result.data

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { errors: { general: ['Nicht authentifiziert.'] } }

  const displayName = [first_name, last_name].filter(Boolean).join(' ')

  const personal_data: Record<string, string> = { name: displayName, last_name }
  if (salutation)              personal_data.salutation = salutation
  if (first_name)              personal_data.first_name = first_name
  if (birth_date)              personal_data.birth_date = birth_date
  if (email)                   personal_data.email = email
  if (phone_mobile)            personal_data.phone_mobile = phone_mobile
  if (phone_landline)          personal_data.phone_landline = phone_landline
  if (emergency_contact_name)  personal_data.emergency_contact_name = emergency_contact_name
  if (emergency_contact_phone) personal_data.emergency_contact_phone = emergency_contact_phone
  if (notes)                   personal_data.notes = notes

  const { error } = await supabase
    .from('clients')
    .update({ display_label: displayName, personal_data })
    .eq('id', clientId)

  if (error) {
    console.error('updateClient error:', error)
    return { errors: { general: ['Klient konnte nicht gespeichert werden.'] } }
  }

  const { revalidatePath } = await import('next/cache')
  revalidatePath(`/clients/${clientId}`)
  redirect(`/clients/${clientId}`)
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
