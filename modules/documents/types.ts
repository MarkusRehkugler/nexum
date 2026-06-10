export interface DocumentRecord {
  id: string
  tenant_id: string
  owner_type: 'client' | 'case' | 'session' | 'invoice' | 'tenant'
  owner_id: string
  type: string
  storage_key: string
  filename: string | null
  mime_type: string | null
  file_size_bytes: number | null
  notes: string | null
  version: number
  retention_until: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface DocumentWithUrl extends DocumentRecord {
  signedUrl: string | null
}

export interface DocumentWithOwner extends DocumentWithUrl {
  ownerLabel: string
  ownerHref: string | null
}

export const DOC_TYPE_LABELS: Record<string, string> = {
  einwilligung: 'Einwilligungserklärung',
  vertrag:      'Coaching-Vertrag',
  anamnese:     'Anamnese / Erstgespräch',
  rechnung:     'Rechnung',
  sonstiges:    'Sonstiges',
}

export const DOC_TYPE_OPTIONS = Object.entries(DOC_TYPE_LABELS) as [string, string][]

export function formatFileSize(bytes: number | null): string {
  if (bytes === null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function mimeTypeIcon(mime: string | null): string {
  if (!mime) return '📄'
  if (mime === 'application/pdf') return '📕'
  if (mime.startsWith('image/')) return '🖼️'
  if (mime.includes('word') || mime.includes('document')) return '📝'
  if (mime.includes('sheet') || mime.includes('excel')) return '📊'
  return '📄'
}
