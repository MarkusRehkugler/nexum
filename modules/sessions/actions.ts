'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createSessionSchema } from './schemas'

export type CreateSessionState = {
  errors?: {
    clientId?: string[]
    type?: string[]
    sessionDate?: string[]
    durationMinutes?: string[]
    notes?: string[]
    general?: string[]
  }
}

/**
 * Findet die aktive Default-Case eines Klienten oder legt sie neu an.
 * Für MVP: ein Klient = eine aktive Case.
 */
async function getOrCreateDefaultCase(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  clientId: string,
  userId: string
): Promise<string | null> {
  // Vorhandene aktive Case suchen
  const { data: existing } = await supabase
    .from('cases')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('client_id', clientId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle()

  if (existing) return existing.id

  // Neue Case anlegen
  const { data: newCase, error } = await supabase
    .from('cases')
    .insert({
      tenant_id: tenantId,
      client_id: clientId,
      owner_user_id: userId,
      profession_type: 'coaching',
      status: 'active',
    })
    .select('id')
    .single()

  if (error) {
    console.error('getOrCreateDefaultCase error:', error)
    return null
  }

  return newCase.id
}

export async function createSessionAction(
  _prevState: CreateSessionState,
  formData: FormData
): Promise<CreateSessionState> {
  const raw = {
    clientId: formData.get('clientId') as string,
    type: formData.get('type') as string,
    sessionDate: formData.get('sessionDate') as string,
    durationMinutes: formData.get('durationMinutes')
      ? Number(formData.get('durationMinutes'))
      : undefined,
    notes: (formData.get('notes') as string) || undefined,
  }

  const result = createSessionSchema.safeParse(raw)
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors }
  }

  const { clientId, type, sessionDate, durationMinutes, notes } = result.data

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

  const caseId = await getOrCreateDefaultCase(supabase, profile.tenant_id, clientId, user.id)
  if (!caseId) {
    return { errors: { general: ['Begleitfall konnte nicht ermittelt werden.'] } }
  }

  const { data: session, error } = await supabase
    .from('sessions')
    .insert({
      tenant_id: profile.tenant_id,
      case_id: caseId,
      user_id: user.id,
      type,
      session_date: new Date(sessionDate).toISOString(),
      duration_minutes: durationMinutes ?? null,
      notes_raw: notes ?? null,
      status: 'draft',
      ai_processing_status: 'none',
    })
    .select('id')
    .single()

  if (error || !session) {
    console.error('createSession error:', error)
    return { errors: { general: ['Sitzung konnte nicht angelegt werden.'] } }
  }

  redirect(`/sessions/${session.id}`)
}
