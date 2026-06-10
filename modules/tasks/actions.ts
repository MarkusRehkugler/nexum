'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { AiExtractedTask } from './types'

export async function createManualTaskAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht authentifiziert.' }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  if (!profile?.tenant_id) return { error: 'Kein Mandant gefunden.' }

  const content = (formData.get('content') as string)?.trim()
  if (!content) return { error: 'Beschreibung ist erforderlich.' }

  const clientId   = (formData.get('client_id') as string) || null
  const due_date   = (formData.get('due_date') as string) || null
  const priority   = (formData.get('priority') as string) || 'medium'

  const { error } = await supabase.from('client_tasks').insert({
    tenant_id:  profile.tenant_id,
    client_id:  clientId,
    session_id: null,
    type:       'other',
    priority,
    content,
    due_date:   due_date || null,
    status:     'open',
  })

  if (error) return { error: 'Aufgabe konnte nicht erstellt werden.' }

  revalidatePath('/tasks')
  if (clientId) revalidatePath(`/clients/${clientId}`)
  return { success: true }
}

/**
 * Speichert die KI-extrahierten Aufgaben als client_tasks in der DB.
 * Wird vom AI-Panel aufgerufen, nachdem der Coach die Aufgaben prüft.
 */
export async function saveAiTasksAction(
  sessionId: string,
  clientId: string,
  tasks: AiExtractedTask[]
): Promise<{ count?: number; error?: string }> {
  if (!tasks || tasks.length === 0) return { count: 0 }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht authentifiziert.' }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) return { error: 'Kein Mandant gefunden.' }

  const rows = tasks.map((t) => ({
    tenant_id: profile.tenant_id,
    session_id: sessionId,
    client_id:  clientId,
    type:       'other' as const,
    priority:   t.priority ?? 'medium',
    content:    t.description,
    due_date:   null,   // dueHint ist ein Freitext, kein ISO-Datum
    status:     'open' as const,
  }))

  const { data, error } = await supabase
    .from('client_tasks')
    .insert(rows)
    .select('id')

  if (error) {
    console.error('saveAiTasksAction error:', error)
    return { error: 'Aufgaben konnten nicht gespeichert werden.' }
  }

  return { count: data?.length ?? 0 }
}

/**
 * Setzt den Status einer Aufgabe (erledigt / offen).
 */
export async function updateTaskStatusAction(
  taskId: string,
  status: 'open' | 'completed' | 'skipped'
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('client_tasks')
    .update({ status })
    .eq('id', taskId)

  if (error) {
    console.error('updateTaskStatus error:', error)
    return { error: 'Status konnte nicht aktualisiert werden.' }
  }

  return {}
}

/**
 * Soft-Delete einer Aufgabe.
 */
export async function deleteTaskAction(taskId: string): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('client_tasks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', taskId)
}
