import Link from 'next/link'
import { Suspense } from 'react'
import { getSessions } from '@/modules/sessions/queries'
import { getClients } from '@/modules/clients/queries'
import { SESSION_TYPE_LABELS } from '@/modules/sessions/schemas'
import { SessionFilters } from './session-filters'
import { FileText, Plus, Mic } from 'lucide-react'

function statusLabel(s: string) {
  return s === 'draft' ? 'Entwurf' : s === 'completed' ? 'Abgeschlossen' : 'Abgerechnet'
}

function statusClass(s: string) {
  return s === 'draft'
    ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
    : s === 'completed'
    ? 'bg-green-50 text-green-700 ring-green-600/20'
    : 'bg-blue-50 text-blue-700 ring-blue-600/20'
}

function aiStatusDot(s: string) {
  return s === 'completed'
    ? '🟢'
    : s === 'processing' || s === 'pending'
    ? '🟡'
    : s === 'failed'
    ? '🔴'
    : '⚪'
}

interface Props {
  searchParams: Promise<{ type?: string; clientId?: string; month?: string }>
}

export default async function SessionsPage({ searchParams }: Props) {
  const filters = await searchParams
  const [sessions, clients] = await Promise.all([
    getSessions({
      type:     filters.type,
      clientId: filters.clientId,
      month:    filters.month,
    }),
    getClients(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Sitzungen</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {sessions.length === 0
              ? 'Noch keine Sitzungen.'
              : `${sessions.length} Sitzung${sessions.length !== 1 ? 'en' : ''}`}
          </p>
        </div>
        <Link
          href="/sessions/new"
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Neue Sitzung
        </Link>
      </div>

      <Suspense>
        <SessionFilters clients={clients.map(c => ({
          id:            c.id,
          display_label: c.display_label,
          personal_data: c.personal_data as { name?: string } | null,
        }))} />
      </Suspense>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white py-16 text-center">
          <FileText className="mb-3 h-8 w-8 text-zinc-300" />
          <p className="text-sm font-medium text-zinc-600">Keine Sitzungen gefunden</p>
          <p className="mt-1 text-xs text-zinc-400">
            Filter anpassen oder{' '}
            <Link href="/sessions/new" className="underline text-zinc-600">neue Sitzung anlegen</Link>.
          </p>
          {!filters.type && !filters.clientId && !filters.month && (
            <Link
              href="/sessions/new"
              className="mt-4 flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
            >
              <Mic className="h-4 w-4" />
              Erste Sitzung anlegen
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead>
              <tr className="bg-zinc-50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Klient</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Datum</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Typ</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Dauer</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">KI</th>
                <th className="relative px-5 py-3"><span className="sr-only">Öffnen</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sessions.map((s) => {
                const clientName = s.case?.client?.personal_data?.name ?? s.case?.client?.display_label ?? '—'
                const date = new Date(s.session_date).toLocaleDateString('de-DE', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                })
                const time = new Date(s.session_date).toLocaleTimeString('de-DE', {
                  hour: '2-digit', minute: '2-digit',
                })
                return (
                  <tr key={s.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-zinc-900">
                      <Link href={`/clients/${s.case?.client_id}`} className="hover:underline">
                        {clientName}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-zinc-600">
                      {date} <span className="text-zinc-400">{time}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-zinc-500">
                      {SESSION_TYPE_LABELS[s.type] ?? s.type}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-zinc-500">
                      {s.duration_minutes ? `${s.duration_minutes} min` : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusClass(s.status)}`}>
                        {statusLabel(s.status)}
                      </span>
                      {(s as { invoice_id?: string | null }).invoice_id && (
                        <Link
                          href={`/invoices/${(s as { invoice_id?: string | null }).invoice_id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="ml-2 text-xs text-zinc-400 hover:text-zinc-700 underline"
                        >
                          RE →
                        </Link>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm" title={s.ai_processing_status}>
                      {aiStatusDot(s.ai_processing_status)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm">
                      <Link href={`/sessions/${s.id}`} className="font-medium text-zinc-900 hover:text-zinc-600">
                        Öffnen →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
