import { getTenantOwnDocuments } from '@/modules/documents/queries'
import { deleteDocumentAction } from '@/modules/documents/actions'
import { DOC_TYPE_LABELS, formatFileSize, mimeTypeIcon } from '@/modules/documents/types'
import { TenantDocumentUpload } from './tenant-upload'
import { FolderOpen } from 'lucide-react'

export default async function DocumentsPage() {
  const documents = await getTenantOwnDocuments()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Dokumentenbibliothek</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Eigene Vorlagen, Formulare und Musterverträge — Klientendokumente liegen in der jeweiligen Klientenakte.
          </p>
        </div>
      </div>

      <TenantDocumentUpload />

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white py-16 text-center">
          <FolderOpen className="h-10 w-10 text-zinc-300 mb-3" />
          <p className="text-sm font-medium text-zinc-500">Noch keine eigenen Dokumente</p>
          <p className="mt-1 text-xs text-zinc-400">
            Lade Einwilligungsvorlagen, Coaching-Verträge oder andere Praxisdokumente hoch.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Datei</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Typ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Kommentar</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-400">Größe</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-400">Datum</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-400" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {documents.map(doc => (
                <tr key={doc.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{mimeTypeIcon(doc.mime_type)}</span>
                      <span className="font-medium text-zinc-800 truncate max-w-xs">{doc.filename ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {DOC_TYPE_LABELS[doc.type] ?? doc.type}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 max-w-xs truncate">
                    {doc.notes ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-500 tabular-nums">
                    {formatFileSize(doc.file_size_bytes)}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-400 tabular-nums whitespace-nowrap">
                    {new Date(doc.created_at).toLocaleDateString('de-DE', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {doc.signedUrl && (
                        <a
                          href={doc.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={doc.filename ?? undefined}
                          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 underline"
                        >
                          Öffnen
                        </a>
                      )}
                      <form action={async () => {
                        'use server'
                        await deleteDocumentAction(doc.id)
                      }}>
                        <button type="submit" className="text-xs text-red-400 hover:text-red-600">
                          Löschen
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
