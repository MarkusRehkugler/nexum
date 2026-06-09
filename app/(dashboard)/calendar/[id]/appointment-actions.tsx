'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, Play, Trash2 } from 'lucide-react'
import { deleteCalendarEntryAction, startSessionFromAppointmentAction } from '@/modules/calendar/actions'

interface Props {
  appointmentId: string
  clientId: string | null
  sessionId: string | null
  startsAt: string
  durationMinutes: number
}

export function AppointmentActions({
  appointmentId,
  clientId,
  sessionId,
  startsAt,
  durationMinutes,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function handleStartSession() {
    if (!clientId) return
    setLoading('session')
    const result = await startSessionFromAppointmentAction(
      appointmentId,
      clientId,
      startsAt,
      durationMinutes || undefined
    )
    if (result.error) {
      alert(result.error)
      setLoading(null)
      return
    }
    router.push(`/sessions/${result.sessionId}`)
  }

  async function handleDelete() {
    if (!confirm('Termin wirklich löschen?')) return
    setLoading('delete')
    await deleteCalendarEntryAction(appointmentId)
  }

  return (
    <div className="flex items-center gap-2">
      {/* Bereits verknüpfte Sitzung öffnen */}
      {sessionId && (
        <a
          href={`/sessions/${sessionId}`}
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-500 transition-colors"
        >
          <Play className="h-4 w-4" />
          Sitzung öffnen
        </a>
      )}

      {/* Neue Sitzung aus Termin starten */}
      {!sessionId && clientId && (
        <button
          onClick={handleStartSession}
          disabled={loading === 'session'}
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-500 disabled:opacity-50 transition-colors"
        >
          {loading === 'session'
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Play className="h-4 w-4" />}
          Sitzung starten
        </button>
      )}

      {/* Löschen */}
      <button
        onClick={handleDelete}
        disabled={loading === 'delete'}
        className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-500 hover:border-red-200 hover:text-red-600 disabled:opacity-50 transition-colors"
      >
        {loading === 'delete'
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <Trash2 className="h-4 w-4" />}
        Löschen
      </button>
    </div>
  )
}
