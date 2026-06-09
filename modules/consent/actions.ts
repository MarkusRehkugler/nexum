'use server'

import { createClient } from '@/lib/supabase/server'
import type { ConsentRecord } from './types'

export type UpdateConsentState = {
  success?: boolean
  error?: string
}

/**
 * Aktualisiert die Einwilligungen eines Klienten.
 * Der Coach dokumentiert damit, welche Einwilligungen er erhalten hat.
 */
export async function updateConsentAction(
  clientId: string,
  updates: Partial<ConsentRecord>
): Promise<UpdateConsentState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Nicht authentifiziert.' }

  // Bestehende consent_records laden
  const { data: client } = await supabase
    .from('clients')
    .select('consent_records')
    .eq('id', clientId)
    .single()

  if (!client) return { error: 'Klient nicht gefunden.' }

  const existing = (client.consent_records as ConsentRecord | null) ?? {}
  const merged: ConsentRecord = {
    ...existing,
    ...updates,
    signed_at: new Date().toISOString(),
    version: '1.0',
  } as ConsentRecord

  const { error } = await supabase
    .from('clients')
    .update({ consent_records: merged })
    .eq('id', clientId)

  if (error) {
    console.error('updateConsent error:', error)
    return { error: 'Einwilligungen konnten nicht gespeichert werden.' }
  }

  return { success: true }
}
