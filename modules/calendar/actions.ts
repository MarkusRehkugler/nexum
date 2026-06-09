'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createCalendarEntrySchema } from './schemas'

export type CreateCalendarEntryState = {
  errors?: {
    title?: string[]
    clientId?: string[]
    type?: string[]
    date?: string[]
    startTime?: string[]
    durationMinutes?: string[]
    description?: string[]
    general?: string[]
  }
}

export async function createCalendarEntryAction(
  _prevState: CreateCalendarEntryState,
  formData: FormData
): Promise<CreateCalendarEntryState> {
  const raw = {
    title:           formData.get('title') as string,
    clientId:        (formData.get('clientId') as string) || null,
    type:            formData.get('type') as string,
    date:            formData.get('date') as string,
    startTime:       formData.get('startTime') as string,
    durationMinutes: formData.get('durationMinutes'),
    description:     (formData.get('description') as string) || null,
  }

  const result = createCalendarEntrySchema.safeParse(raw)
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors }
  }

  const { title, clientId, type, date, startTime, durationMinutes, description } = result.data

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

  // Datum + Uhrzeit zu ISO-Timestamp kombinieren
  const startsAt = new Date(`${date}T${startTime}:00`)
  const endsAt   = new Date(startsAt.getTime() + durationMinutes * 60 * 1000)

  if (isNaN(startsAt.getTime())) {
    return { errors: { date: ['Ungültiges Datum/Uhrzeit.'] } }
  }

  const { data: entry, error } = await supabase
    .from('calendar_entries')
    .insert({
      tenant_id:   profile.tenant_id,
      user_id:     user.id,
      client_id:   clientId ?? null,
      type,
      title,
      description: description ?? null,
      starts_at:   startsAt.toISOString(),
      ends_at:     endsAt.toISOString(),
    })
    .select('id')
    .single()

  if (error || !entry) {
    console.error('createCalendarEntry error:', error)
    return { errors: { general: ['Termin konnte nicht angelegt werden.'] } }
  }

  redirect(`/calendar/${entry.id}`)
}

/**
 * Löscht einen Termin (Soft-Delete).
 */
export async function deleteCalendarEntryAction(id: string): Promise<void> {
  const supabase = await createClient()

  await supabase
    .from('calendar_entries')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  redirect('/calendar')
}

/**
 * Erstellt eine Sitzung aus einem Kalendertermin heraus und verknüpft beides.
 * Voraussetzung: Termin hat einen client_id.
 */
export async function startSessionFromAppointmentAction(
  appointmentId: string,
  clientId: string,
  sessionDate: string,
  durationMinutes?: number
): Promise<{ error?: string; sessionId?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Nicht authentifiziert.' }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) return { error: 'Kein Mandant gefunden.' }

  // Case suchen oder anlegen
  const { data: existingCase } = await supabase
    .from('cases')
    .select('id')
    .eq('tenant_id', profile.tenant_id)
    .eq('client_id', clientId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle()

  let caseId = existingCase?.id

  if (!caseId) {
    const { data: newCase, error: caseError } = await supabase
      .from('cases')
      .insert({
        tenant_id:      profile.tenant_id,
        client_id:      clientId,
        owner_user_id:  user.id,
        profession_type: 'coaching',
        status:          'active',
      })
      .select('id')
      .single()

    if (caseError || !newCase) return { error: 'Begleitfall konnte nicht angelegt werden.' }
    caseId = newCase.id
  }

  // Sitzung anlegen
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      tenant_id:           profile.tenant_id,
      case_id:             caseId,
      user_id:             user.id,
      type:                'individual',
      session_date:        sessionDate,
      duration_minutes:    durationMinutes ?? null,
      status:              'draft',
      ai_processing_status: 'none',
    })
    .select('id')
    .single()

  if (sessionError || !session) return { error: 'Sitzung konnte nicht angelegt werden.' }

  // Termin mit Sitzung verknüpfen
  await supabase
    .from('calendar_entries')
    .update({ session_id: session.id })
    .eq('id', appointmentId)

  return { sessionId: session.id }
}
