'use server'

import Link from 'next/link'
import { getUnbilledSessions } from '@/modules/invoices/queries'
import { SESSION_TYPE_LABELS } from '@/modules/sessions/schemas'
import { BillingClientGroup } from './billing-client-group'
import { Receipt, CheckCircle2 } from 'lucide-react'

export default async function BillingPage() {
  const sessions = await getUnbilledSessions()

  // Gruppieren nach Klient
  const grouped = new Map<string, {
    clientId: string
    clientName: string
    sessions: typeof sessions
  }>()

  for (const s of sessions) {
    const clientId = s.case?.client_id
    if (!clientId) continue
    if (!grouped.has(clientId)) {
      grouped.set(clientId, {
        clientId,
        clientName: s.case?.client?.personal_data?.name ?? s.case?.client?.display_label ?? '—',
        sessions: [],
      })
    }
    grouped.get(clientId)!.sessions.push(s)
  }

  const groups = Array.from(grouped.values()).sort((a, b) =>
    a.clientName.localeCompare(b.clientName, 'de')
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Offene Abrechnung</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {sessions.length === 0
              ? 'Alle Sitzungen sind abgerechnet.'
              : `${sessions.length} Sitzung${sessions.length !== 1 ? 'en' : ''} bei ${groups.length} Klient${groups.length !== 1 ? 'en' : ''} noch nicht abgerechnet`}
          </p>
        </div>
        <Link
          href="/invoices"
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          ← Rechnungen
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white py-16 text-center">
          <CheckCircle2 className="mb-3 h-8 w-8 text-green-400" />
          <p className="text-sm font-medium text-zinc-600">Alle Sitzungen sind abgerechnet</p>
          <p className="mt-1 text-xs text-zinc-400">Es gibt keine offenen Sitzungen.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <BillingClientGroup
              key={group.clientId}
              clientId={group.clientId}
              clientName={group.clientName}
              sessions={group.sessions}
              sessionTypeLabels={SESSION_TYPE_LABELS}
            />
          ))}
        </div>
      )}
    </div>
  )
}
