'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Plus, Loader2 } from 'lucide-react'
import { uploadDocumentAction } from '@/modules/documents/actions'
import { DOC_TYPE_OPTIONS } from '@/modules/documents/types'

export function TenantDocumentUpload() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [showForm, setShowForm] = useState(false)
  const [uploading, startUpload] = useTransition()
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function handleUpload(formData: FormData) {
    formData.set('owner_type', 'tenant')

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

  return (
    <div>
      {!showForm && (
        <button
          onClick={() => { setShowForm(true); setUploadError(null) }}
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Dokument hochladen
        </button>
      )}

      {showForm && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm max-w-lg">
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
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                Kommentar <span className="text-zinc-400">(optional)</span>
              </label>
              <input
                name="notes"
                type="text"
                placeholder="z. B. Einwilligungsvorlage Version 3, Stand 2026"
                className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
              />
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
    </div>
  )
}
