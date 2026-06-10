'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function uploadDocumentAction(
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht authentifiziert.' }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  if (!profile) return { error: 'Tenant nicht gefunden.' }

  const file = formData.get('file') as File
  if (!file || file.size === 0) return { error: 'Keine Datei ausgewählt.' }
  if (file.size > 52_428_800) return { error: 'Datei zu groß (max. 50 MB).' }

  const VALID_OWNER_TYPES = ['client', 'session', 'tenant']
  const ownerType = formData.get('owner_type') as string
  if (!VALID_OWNER_TYPES.includes(ownerType)) {
    return { error: 'Ungültiger Besitzer-Typ.' }
  }

  let ownerId: string
  if (ownerType === 'tenant') {
    ownerId = profile.tenant_id
  } else {
    ownerId = formData.get('owner_id') as string
    if (!ownerId) return { error: 'Fehlende Besitzer-ID.' }
  }

  const VALID_DOC_TYPES = ['einwilligung', 'vertrag', 'anamnese', 'rechnung', 'sonstiges']
  const docType = (formData.get('type') as string) || 'sonstiges'
  if (!VALID_DOC_TYPES.includes(docType)) return { error: 'Ungültiger Dokumenttyp.' }

  const notes = (formData.get('notes') as string) || null

  const ext = file.name.split('.').pop() ?? 'bin'
  const storagePath = `${profile.tenant_id}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, file)
  if (uploadError) return { error: uploadError.message }

  const { error: dbError } = await supabase.from('documents').insert({
    tenant_id:       profile.tenant_id,
    owner_type:      ownerType,
    owner_id:        ownerId,
    type:            docType,
    storage_key:     storagePath,
    filename:        file.name,
    mime_type:       file.type || null,
    file_size_bytes: file.size,
    notes,
  })

  if (dbError) {
    await supabase.storage.from('documents').remove([storagePath])
    return { error: dbError.message }
  }

  if (ownerType === 'client') revalidatePath(`/clients/${ownerId}`)
  revalidatePath('/documents')
  return {}
}

export async function deleteDocumentAction(
  id: string,
  ownerId?: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Storage-Key aus DB lesen — RLS stellt sicher, dass nur eigene Dokumente gelesen werden.
  // Nicht vom Client übernehmen, da sonst DB-Delete und Storage-Delete auseinanderlaufen können.
  const { data: doc, error: fetchError } = await supabase
    .from('documents')
    .select('storage_key')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (fetchError || !doc) return { error: 'Dokument nicht gefunden.' }

  const { error } = await supabase
    .from('documents')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  await supabase.storage.from('documents').remove([doc.storage_key])

  if (ownerId) revalidatePath(`/clients/${ownerId}`)
  revalidatePath('/documents')
  return {}
}
