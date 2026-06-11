'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { UnbilledSession } from '@/modules/invoices/queries'
import { Receipt, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  clientId: string
  clientName: string
  sessions: UnbilledSession[]
  sessionTypeLabels: Record<string, string>
}

export function BillingClientGroup({ clientId, clientName, sessions, sessionTypeLabels }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState(true)

  function toggleAll() {
    if (selected.size === sessions.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(sessions.map(s => s.id)))
    }
  }

  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  function createInvoice() {
    const ids = Array.from(selected)
    if (!ids.length) return
    const params = new URLSearchParams()
    params.set('clientId', clientId)
    ids.forEach(id => params.append('sessions', id))
    router.push(`/invoices/new?${params.toString()}`)
  }

  const allSelected = selected.size === sessions.length && sessions.length > 0

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-5 py-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-semibold text-zinc-900 hover:text-zinc-600"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {clientName}
          <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-normal text-zinc-600">
            {sessions.length} offen
          </span>
        </button>

        {selected.size > 0 && (
          <button
            type="button"
            onClick={createInvoice}
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 transition-colors"
          >
            <Receipt className="h-3.5 w-3.5" />
            {selected.size === 1
              ? '1 Sitzung abrechnen'
              : `${selected.size} Sitzungen abrechnen`}
          </button>
        )}
      </div>

      {/* Table */}
      {expanded && (
        <table className="min-w-full divide-y divide-zinc-100">
          <thead>
            <tr className="bg-white">
              <th className="w-10 px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                />
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Datum</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Typ</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Dauer</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {sessions.map((s) => {
              const date = new Date(s.session_date).toLocaleDateString('de-DE', {
                day: '2-digit', month: '2-digit', year: 'numeric',
              })
              const time = new Date(s.session_date).toLocaleTimeString('de-DE', {
                hour: '2-digit', minute: '2-digit',
              })
              return (
                <tr
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  className={`cursor-pointer transition-colors ${
                    selected.has(s.id) ? 'bg-zinc-50' : 'hover:bg-zinc-50'
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={() => toggle(s.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-900">
                    {date} <span className="text-zinc-400">{time}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {sessionTypeLabels[s.type] ?? s.type}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {s.duration_minutes ? `${s.duration_minutes} min` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                      s.status === 'completed'
                        ? 'bg-green-50 text-green-700 ring-green-600/20'
                        : 'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
                    }`}>
                      {s.status === 'completed' ? 'Abgeschlossen' : 'Entwurf'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* Footer wenn Auswahl */}
      {expanded && selected.size > 0 && (
        <div className="border-t border-zinc-100 bg-zinc-50 px-5 py-3 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            {selected.size} von {sessions.length} Sitzungen ausgewählt
          </span>
          <button
            type="button"
            onClick={createInvoice}
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
          >
            <Receipt className="h-4 w-4" />
            Rechnung erstellen
          </button>
        </div>
      )}
    </div>
  )
}
