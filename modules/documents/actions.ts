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

  const ownerType = formData.get('owner_type') as string
  const ownerId = formData.get('owner_id') as string
  const docType = (formData.get('type') as string) || 'sonstiges'

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
  storageKey: string,
  ownerId?: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('documents')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  await supabase.storage.from('documents').remove([storageKey])

  if (ownerId) revalidatePath(`/clients/${ownerId}`)
  revalidatePath('/documents')
  return {}
}
