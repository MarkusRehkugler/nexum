'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
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
    title:            formData.get('title') as string,
    clientId:         (formData.get('clientId') as string) || null,
    type:             formData.get('type') as string,
    date:             formData.get('date') as string,
    startTime:        formData.get('startTime') as string,
    durationMinutes:  formData.get('durationMinutes'),
    description:      (formData.get('description') as string) || null,
    isGroupEvent:     formData.get('isGroupEvent') === 'true',
    maxParticipants:  formData.get('maxParticipants') || null,
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

  const isGroupEvent  = result.data.isGroupEvent ?? false
  const maxParticipants = result.data.maxParticipants ?? null
  const participantIds = (formData.getAll('participantIds') as string[]).filter(Boolean)

  const { data: entry, error } = await supabase
    .from('calendar_entries')
    .insert({
      tenant_id:        profile.tenant_id,
      user_id:          user.id,
      client_id:        isGroupEvent ? null : (clientId ?? null),
      type,
      title,
      description:      description ?? null,
      starts_at:        startsAt.toISOString(),
      ends_at:          endsAt.toISOString(),
      is_group_event:   isGroupEvent,
      max_participants: maxParticipants,
    })
    .select('id')
    .single()

  if (error || !entry) {
    console.error('createCalendarEntry error:', error)
    return { errors: { general: ['Termin konnte nicht angelegt werden.'] } }
  }

  // Teilnehmer eintragen (Gruppen-Termin)
  if (isGroupEvent && participantIds.length > 0) {
    await supabase
      .from('group_event_participants')
      .insert(
        participantIds.map(cid => ({
          tenant_id: profile.tenant_id,
          entry_id:  entry.id,
          client_id: cid,
        }))
      )
  }

  redirect(`/calendar/${entry.id}`)
}

/**
 * Fügt einen Teilnehmer zu einem Gruppen-Termin hinzu.
 */
export async function addGroupParticipantAction(
  entryId: string,
  clientId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht authentifiziert.' }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  const { error } = await supabase
    .from('group_event_participants')
    .upsert(
      { tenant_id: profile!.tenant_id, entry_id: entryId, client_id: clientId, deleted_at: null },
      { onConflict: 'entry_id,client_id' }
    )

  if (error) return { error: 'Teilnehmer konnte nicht hinzugefügt werden.' }
  revalidatePath(`/calendar/${entryId}`)
  return {}
}

/**
 * Entfernt einen Teilnehmer (Soft-Delete).
 */
export async function removeGroupParticipantAction(
  participantId: string,
  entryId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('group_event_participants')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', participantId)

  if (error) return { error: 'Teilnehmer konnte nicht entfernt werden.' }
  revalidatePath(`/calendar/${entryId}`)
  return {}
}

/**
 * Schaltet die Anwesenheit eines Teilnehmers um.
 */
export async function toggleAttendanceAction(
  participantId: string,
  attended: boolean,
  entryId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('group_event_participants')
    .update({ attended })
    .eq('id', participantId)

  if (error) return { error: 'Anwesenheit konnte nicht gespeichert werden.' }
  revalidatePath(`/calendar/${entryId}`)
  return {}
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
