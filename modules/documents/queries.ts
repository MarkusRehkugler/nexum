import { createClient } from '@/lib/supabase/server'
import type { DocumentWithUrl, DocumentWithOwner, DocumentRecord } from './types'

export async function getTenantOwnDocuments(): Promise<DocumentWithUrl[]> {
  const supabase = await createClient()

  const { data: docs } = await supabase
    .from('documents')
    .select('*')
    .eq('owner_type', 'tenant')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (!docs?.length) return []

  const { data: urlData } = await supabase.storage
    .from('documents')
    .createSignedUrls(docs.map(d => d.storage_key), 3600)

  const urlMap = new Map(urlData?.map(u => [u.path, u.signedUrl]) ?? [])

  return docs.map(doc => ({
    ...(doc as DocumentRecord),
    signedUrl: urlMap.get(doc.storage_key) ?? null,
  }))
}

export async function getDocumentsWithSignedUrls(
  ownerType: string,
  ownerId: string
): Promise<DocumentWithUrl[]> {
  const supabase = await createClient()

  const { data: docs } = await supabase
    .from('documents')
    .select('*')
    .eq('owner_type', ownerType)
    .eq('owner_id', ownerId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (!docs?.length) return []

  const { data: urlData } = await supabase.storage
    .from('documents')
    .createSignedUrls(docs.map(d => d.storage_key), 3600)

  const urlMap = new Map(urlData?.map(u => [u.path, u.signedUrl]) ?? [])

  return docs.map(doc => ({
    ...(doc as DocumentRecord),
    signedUrl: urlMap.get(doc.storage_key) ?? null,
  }))
}

export async function getAllTenantDocuments(): Promise<DocumentWithOwner[]> {
  const supabase = await createClient()

  const [{ data: docs }, { data: clients }] = await Promise.all([
    supabase
      .from('documents')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('clients')
      .select('id, display_label, personal_data')
      .is('deleted_at', null),
  ])

  if (!docs?.length) return []

  const clientMap = new Map(clients?.map(c => [c.id, c]) ?? [])

  const { data: urlData } = await supabase.storage
    .from('documents')
    .createSignedUrls(docs.map(d => d.storage_key), 3600)

  const urlMap = new Map(urlData?.map(u => [u.path, u.signedUrl]) ?? [])

  return docs.map(doc => {
    const client = clientMap.get(doc.owner_id)
    const ownerLabel =
      doc.owner_type === 'client'
        ? ((client?.personal_data as { name?: string })?.name ?? client?.display_label ?? '—')
        : doc.owner_type === 'tenant'
          ? 'Allgemein'
          : doc.owner_type

    return {
      ...(doc as DocumentRecord),
      signedUrl: urlMap.get(doc.storage_key) ?? null,
      ownerLabel,
      ownerHref: doc.owner_type === 'client' ? `/clients/${doc.owner_id}` : null,
    }
  })
}
