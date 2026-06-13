'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { UserPlus, Trash2, Check, X, Receipt } from 'lucide-react'
import {
  addGroupParticipantAction,
  removeGroupParticipantAction,
  toggleAttendanceAction,
} from '@/modules/calendar/actions'

interface Participant {
  id: string
  client_id: string
  attended: boolean
  client: {
    id: string
    display_label: string
    personal_data?: { name?: string }
  } | null
}

interface AvailableClient {
  id: string
  display_label: string
  personal_data?: { name?: string } | null
}

interface Props {
  entryId: string
  entryTitle: string
  entryDate: string  // ISO starts_at
  maxParticipants: number | null
  initialParticipants: Participant[]
  availableClients: AvailableClient[]
}

function clientName(p: Participant) {
  return p.client?.personal_data?.name ?? p.client?.display_label ?? '—'
}

export function ParticipantsPanel({
  entryId,
  entryTitle,
  entryDate,
  maxParticipants,
  initialParticipants,
  availableClients,
}: Props) {
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants)
  const [showAdd, setShowAdd] = useState(false)
  const [addClientId, setAddClientId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const existingClientIds = new Set(participants.map(p => p.client_id))
  const notYetAdded = availableClients.filter(c => !existingClientIds.has(c.id))

  const dateLabel = new Date(entryDate).toLocaleDateString('de-DE', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  function handleToggleAttendance(p: Participant) {
    const newVal = !p.attended
    setParticipants(prev => prev.map(x => x.id === p.id ? { ...x, attended: newVal } : x))
    startTransition(async () => {
      const res = await toggleAttendanceAction(p.id, newVal, entryId)
      if (res.error) {
        setParticipants(prev => prev.map(x => x.id === p.id ? { ...x, attended: p.attended } : x))
        setError(res.error)
      }
    })
  }

  function handleRemove(p: Participant) {
    setParticipants(prev => prev.filter(x => x.id !== p.id))
    startTransition(async () => {
      const res = await removeGroupParticipantAction(p.id, entryId)
      if (res.error) {
        setParticipants(prev => [...prev, p])
        setError(res.error)
      }
    })
  }

  function handleAdd() {
    if (!addClientId) return
    const client = availableClients.find(c => c.id === addClientId)
    if (!client) return

    const optimistic: Participant = {
      id: `tmp-${Date.now()}`,
      client_id: addClientId,
      attended: false,
      client: {
        id: client.id,
        display_label: client.display_label,
        personal_data: (client.personal_data as any) ?? undefined,
      },
    }
    setParticipants(prev => [...prev, optimistic])
    setShowAdd(false)
    setAddClientId('')

    startTransition(async () => {
      const res = await addGroupParticipantAction(entryId, addClientId)
      if (res.error) {
        setParticipants(prev => prev.filter(x => x.id !== optimistic.id))
        setError(res.error)
      }
    })
  }

  const attendedCount = participants.filter(p => p.attended).length
  const total = participants.length

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
        <div>
          <h2 className="text-sm font-semibold text-zinc-700">Teilnehmer</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {total} Teilnehmer{maxParticipants ? ` · max. ${maxParticipants}` : ''}
            {total > 0 ? ` · ${attendedCount} anwesend` : ''}
          </p>
        </div>
        {notYetAdded.length > 0 && (!maxParticipants || total < maxParticipants) && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Hinzufügen
          </button>
        )}
      </div>

      {error && (
        <div className="mx-5 mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
      )}

      {/* Teilnehmer hinzufügen */}
      {showAdd && (
        <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-100 bg-zinc-50">
          <select
            value={addClientId}
            onChange={e => setAddClientId(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none"
          >
            <option value="">— Klient auswählen —</option>
            {notYetAdded.map(c => (
              <option key={c.id} value={c.id}>
                {(c.personal_data as any)?.name || c.display_label}
              </option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            disabled={!addClientId || isPending}
            className="flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-40 transition-colors"
          >
            <Check className="h-3.5 w-3.5" />
            OK
          </button>
          <button
            onClick={() => { setShowAdd(false); setAddClientId('') }}
            className="text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Teilnehmerliste */}
      {participants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
          <p className="text-sm text-zinc-400">Noch keine Teilnehmer eingetragen.</p>
          {notYetAdded.length > 0 && (
            <button onClick={() => setShowAdd(true)} className="text-xs text-zinc-500 underline hover:text-zinc-800 transition-colors">
              Ersten Teilnehmer hinzufügen
            </button>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {participants.map(p => (
            <li key={p.id} className="flex items-center gap-3 px-5 py-3">
              {/* Anwesenheit Toggle */}
              <button
                onClick={() => handleToggleAttendance(p)}
                disabled={isPending}
                title={p.attended ? 'Als abwesend markieren' : 'Als anwesend markieren'}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold text-white transition-colors ${p.attended ? 'bg-green-500 border-green-500' : 'border-zinc-300 hover:border-green-400'}`}
              >
                {p.attended ? '✓' : ''}
              </button>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/clients/${p.client_id}`}
                  className="text-sm font-medium text-zinc-900 hover:text-violet-600 transition-colors"
                >
                  {clientName(p)}
                </Link>
                {p.attended && (
                  <span className="ml-2 text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full font-medium">
                    Anwesend
                  </span>
                )}
              </div>

              {/* Rechnung erstellen */}
              <Link
                href={`/invoices/new?clientId=${p.client_id}`}
                title="Rechnung erstellen"
                className="shrink-0 text-zinc-300 hover:text-zinc-600 transition-colors"
              >
                <Receipt className="h-4 w-4" />
              </Link>

              {/* Entfernen */}
              <button
                onClick={() => handleRemove(p)}
                disabled={isPending}
                title="Teilnehmer entfernen"
                className="shrink-0 text-zinc-300 hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Alle abrechnen */}
      {participants.length > 0 && (
        <div className="px-5 py-3 border-t border-zinc-100 flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            {dateLabel}
          </p>
          <Link
            href={`/invoices/billing`}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            <Receipt className="h-3.5 w-3.5" />
            Zur Abrechnung
          </Link>
        </div>
      )}
    </div>
  )
}
