'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  createCalendarEntryAction,
  type CreateCalendarEntryState,
} from '@/modules/calendar/actions'
import type { ClientRecord } from '@/modules/clients/types'

const initialState: CreateCalendarEntryState = {}

interface Props {
  clients: ClientRecord[]
  defaultClientId?: string
  defaultDate?: string   // YYYY-MM-DD
}

const DURATIONS = [
  { label: '30 Min', value: '30' },
  { label: '45 Min', value: '45' },
  { label: '60 Min (1 Std)', value: '60' },
  { label: '90 Min', value: '90' },
  { label: '120 Min (2 Std)', value: '120' },
]

const TYPES = [
  { label: 'Sitzung', value: 'session' },
  { label: 'Geblockt', value: 'block' },
  { label: 'Sonstiger Termin', value: 'event' },
  { label: 'Erinnerung', value: 'reminder' },
]

export function CreateAppointmentForm({ clients, defaultClientId, defaultDate }: Props) {
  const [state, action, pending] = useActionState(createCalendarEntryAction, initialState)

  const today = defaultDate ?? new Date().toISOString().split('T')[0]

  return (
    <form action={action} className="space-y-5">
      {state.errors?.general && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.errors.general[0]}
        </div>
      )}

      {/* Titel */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-zinc-700 mb-1.5">
          Titel <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          placeholder="z. B. Coaching-Sitzung"
          required
          disabled={pending}
          className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
        />
        {state.errors?.title && (
          <p className="mt-1.5 text-xs text-red-600">{state.errors.title[0]}</p>
        )}
      </div>

      {/* Typ */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-zinc-700 mb-1.5">
          Typ
        </label>
        <select
          id="type"
          name="type"
          defaultValue="session"
          disabled={pending}
          className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Klient */}
      <div>
        <label htmlFor="clientId" className="block text-sm font-medium text-zinc-700 mb-1.5">
          Klient
          <span className="ml-1.5 text-xs font-normal text-zinc-400">(optional)</span>
        </label>
        <select
          id="clientId"
          name="clientId"
          defaultValue={defaultClientId ?? ''}
          disabled={pending}
          className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
        >
          <option value="">— kein Klient —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.personal_data?.name || c.display_label}
            </option>
          ))}
        </select>
        {state.errors?.clientId && (
          <p className="mt-1.5 text-xs text-red-600">{state.errors.clientId[0]}</p>
        )}
      </div>

      {/* Datum + Uhrzeit */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-zinc-700 mb-1.5">
            Datum <span className="text-red-500">*</span>
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={today}
            required
            disabled={pending}
            className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
          />
          {state.errors?.date && (
            <p className="mt-1.5 text-xs text-red-600">{state.errors.date[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="startTime" className="block text-sm font-medium text-zinc-700 mb-1.5">
            Uhrzeit <span className="text-red-500">*</span>
          </label>
          <input
            id="startTime"
            name="startTime"
            type="time"
            defaultValue="09:00"
            required
            disabled={pending}
            className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
          />
          {state.errors?.startTime && (
            <p className="mt-1.5 text-xs text-red-600">{state.errors.startTime[0]}</p>
          )}
        </div>
      </div>

      {/* Dauer */}
      <div>
        <label htmlFor="durationMinutes" className="block text-sm font-medium text-zinc-700 mb-1.5">
          Dauer
        </label>
        <select
          id="durationMinutes"
          name="durationMinutes"
          defaultValue="60"
          disabled={pending}
          className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
        >
          {DURATIONS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
        {state.errors?.durationMinutes && (
          <p className="mt-1.5 text-xs text-red-600">{state.errors.durationMinutes[0]}</p>
        )}
      </div>

      {/* Beschreibung */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-zinc-700 mb-1.5">
          Notiz
          <span className="ml-1.5 text-xs font-normal text-zinc-400">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          placeholder="z. B. Videolink, Thema …"
          disabled={pending}
          className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-50 resize-none"
        />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending
            ? <><Loader2 className="h-4 w-4 animate-spin" />Wird gespeichert…</>
            : 'Termin anlegen'}
        </button>
        <a href="/calendar" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
          Abbrechen
        </a>
      </div>
    </form>
  )
}
