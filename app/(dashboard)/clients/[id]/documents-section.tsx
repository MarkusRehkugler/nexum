'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Trash2, Download, Plus, Loader2 } from 'lucide-react'
import { uploadDocumentAction, deleteDocumentAction } from '@/modules/documents/actions'
import {
  DOC_TYPE_OPTIONS,
  DOC_TYPE_LABELS,
  formatFileSize,
  mimeTypeIcon,
  type DocumentWithUrl,
} from '@/modules/documents/types'

interface Props {
  clientId: string
  initialDocuments: DocumentWithUrl[]
}

export function DocumentsSection({ clientId, initialDocuments }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [showForm, setShowForm] = useState(false)
  const [uploading, startUpload] = useTransition()
  const [deleting, startDelete] = useTransition()
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  async function handleUpload(formData: FormData) {
    formData.set('owner_type', 'client')
    formData.set('owner_id', clientId)

    startUpload(async () => {
      const result = await uploadDocumentAction(formData)
      if (result.error) {
        setUploadError(result.error)
      } else {
        setUploadError(null)
        setShowForm(false)
        if (fileRef.current) fileRef.current.value = ''
        router.refresh()
      }
    })
  }

  function handleDelete(id: string, storageKey: string) {
    startDelete(async () => {
      await deleteDocumentAction(id, storageKey, clientId)
      setConfirmDeleteId(null)
      router.refresh()
    })
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
        <h2 className="text-sm font-semibold text-zinc-700">Dokumente</h2>
        <button
          onClick={() => { setShowForm(v => !v); setUploadError(null) }}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Hochladen
        </button>
      </div>

      {/* Upload-Formular */}
      {showForm && (
        <div className="border-b border-zinc-100 p-5">
          <form action={handleUpload} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Datei *</label>
              <input
                ref={fileRef}
                name="file"
                type="file"
                required
                className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-zinc-700 hover:file:bg-zinc-200 cursor-pointer"
              />
              <p className="mt-1 text-xs text-zinc-400">Max. 50 MB — PDF, Word, Bilder</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Dokumenttyp</label>
              <select
                name="type"
                defaultValue="sonstiges"
                className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-200"
              >
                {DOC_TYPE_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            {uploadError && (
              <p className="text-xs text-red-600">{uploadError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={uploading}
                className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                {uploading
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Wird hochgeladen…</>
                  : <><Upload className="h-3.5 w-3.5" />Hochladen</>
                }
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dokumentenliste */}
      {initialDocuments.length === 0 ? (
        <p className="px-5 py-6 text-sm text-zinc-400 text-center">
          Noch keine Dokumente hinterlegt.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {initialDocuments.map(doc => (
            <li key={doc.id} className="flex items-center gap-3 px-5 py-3">
              <span className="text-lg shrink-0">{mimeTypeIcon(doc.mime_type)}</span>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900">{doc.filename ?? '—'}</p>
                <p className="text-xs text-zinc-400">
                  {DOC_TYPE_LABELS[doc.type] ?? doc.type}
                  {doc.file_size_bytes ? ` · ${formatFileSize(doc.file_size_bytes)}` : ''}
                  {' · '}
                  {new Date(doc.created_at).toLocaleDateString('de-DE', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {doc.signedUrl && (
                  <a
                    href={doc.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={doc.filename ?? undefined}
                    className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                    title="Herunterladen"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                )}
                {confirmDeleteId === doc.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(doc.id, doc.storage_key)}
                      disabled={deleting}
                      className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Löschen'}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100"
                    >
                      Abbrechen
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(doc.id)}
                    className="rounded-md p-1.5 text-zinc-300 hover:bg-zinc-100 hover:text-red-500 transition-colors"
                    title="Löschen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
