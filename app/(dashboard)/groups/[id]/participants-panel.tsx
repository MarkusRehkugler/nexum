'use client'

import { useState, useTransition } from 'react'
import { Users, Plus, Trash2 } from 'lucide-react'
import {
  addCourseParticipantAction,
  removeParticipantAction,
  updateParticipantStatusAction,
} from '@/modules/courses/actions'
import type { CourseParticipant, ParticipantStatus } from '@/modules/courses/types'
import type { ClientRecord } from '@/modules/clients/types'

const STATUS_CYCLE: ParticipantStatus[] = ['registered', 'waitlist', 'cancelled']

const STATUS_COLORS: Record<ParticipantStatus, string> = {
  registered: 'bg-green-100 text-green-700 hover:bg-green-200',
  waitlist:   'bg-amber-100 text-amber-700 hover:bg-amber-200',
  cancelled:  'bg-zinc-100 text-zinc-500 hover:bg-zinc-200',
}

const STATUS_LABELS: Record<ParticipantStatus, string> = {
  registered: 'Angemeldet',
  waitlist:   'Warteliste',
  cancelled:  'Abgemeldet',
}

interface Props {
  courseId: string
  maxParticipants: number | null
  initialParticipants: CourseParticipant[]
  allClients: ClientRecord[]
}

export function ParticipantsPanel({
  courseId,
  maxParticipants,
  initialParticipants,
  allClients,
}: Props) {
  const [participants, setParticipants] = useState(initialParticipants)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const active          = participants.filter(p => p.status !== 'cancelled')
  const enrolledIds     = new Set(active.map(p => p.client_id))
  const availableClients = allClients.filter(c => !enrolledIds.has(c.id))
  const isFull          = maxParticipants != null && active.filter(p => p.status === 'registered').length >= maxParticipants

  function addParticipant() {
    if (!selectedClientId) return
    setError(null)
    startTransition(async () => {
      const result = await addCourseParticipantAction(courseId, selectedClientId)
      if (result.error) { setError(result.error); return }
      const client = allClients.find(c => c.id === selectedClientId)
      setParticipants(prev => [
        ...prev,
        {
          id:            crypto.randomUUID(),
          tenant_id:     '',
          course_id:     courseId,
          client_id:     selectedClientId,
          status:        'registered' as ParticipantStatus,
          registered_at: new Date().toISOString(),
          deleted_at:    null,
          client:        client
            ? { id: client.id, display_label: client.display_label, personal_data: client.personal_data }
            : undefined,
        },
      ])
      setSelectedClientId('')
    })
  }

  function remove(participantId: string) {
    setError(null)
    startTransition(async () => {
      const result = await removeParticipantAction(participantId, courseId)
      if (result.error) { setError(result.error); return }
      setParticipants(prev => prev.filter(p => p.id !== participantId))
    })
  }

  function cycleStatus(p: CourseParticipant) {
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(p.status) + 1) % STATUS_CYCLE.length]
    setError(null)
    startTransition(async () => {
      const result = await updateParticipantStatusAction(p.id, next, courseId)
      if (result.error) { setError(result.error); return }
      setParticipants(prev => prev.map(x => x.id === p.id ? { ...x, status: next } : x))
    })
  }

  function clientName(p: CourseParticipant) {
    return p.client?.personal_data?.name || p.client?.display_label || 'Unbekannt'
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
        <h2 className="text-sm font-semibold text-zinc-700">
          Teilnehmer ({active.length}{maxParticipants ? `/${maxParticipants}` : ''})
        </h2>
        {isFull && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
            Ausgebucht
          </span>
        )}
      </div>

      {/* Hinzufügen */}
      <div className="flex items-center gap-2 border-b border-zinc-100 px-5 py-3">
        <select
          value={selectedClientId}
          onChange={e => setSelectedClientId(e.target.value)}
          disabled={isPending || availableClients.length === 0}
          className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none disabled:opacity-50"
        >
          <option value="">
            {availableClients.length === 0 ? 'Alle Klienten eingetragen' : '— Klient auswählen —'}
          </option>
          {availableClients.map(c => (
            <option key={c.id} value={c.id}>
              {c.personal_data?.name || c.display_label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={addParticipant}
          disabled={!selectedClientId || isPending}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-40 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Hinzufügen
        </button>
      </div>

      {error && (
        <div className="mx-5 mt-3 rounded-lg bg-red-50 px-4 py-2 text-xs text-red-700">{error}</div>
      )}

      {/* Liste */}
      {participants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Users className="mb-2 h-8 w-8 text-zinc-200" />
          <p className="text-sm text-zinc-400">Noch keine Teilnehmer angemeldet.</p>
        </div>
      ) : (
        <div className="max-h-80 divide-y divide-zinc-100 overflow-y-auto">
          {participants.map(p => (
            <div key={p.id} className="flex items-center gap-3 px-5 py-3">
              <div className="flex-1 min-w-0">
                <p className={`truncate text-sm font-medium ${p.status === 'cancelled' ? 'text-zinc-400 line-through' : 'text-zinc-800'}`}>
                  {clientName(p)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => cycleStatus(p)}
                disabled={isPending}
                title="Status wechseln"
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${STATUS_COLORS[p.status]}`}
              >
                {STATUS_LABELS[p.status]}
              </button>
              <button
                type="button"
                onClick={() => remove(p.id)}
                disabled={isPending}
                title="Entfernen"
                className="shrink-0 text-zinc-300 transition-colors hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
