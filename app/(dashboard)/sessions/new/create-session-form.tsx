'use client'

import { useActionState } from 'react'
import { createSessionAction, type CreateSessionState } from '@/modules/sessions/actions'
import { SESSION_TYPE_LABELS } from '@/modules/sessions/schemas'
import type { ClientRecord } from '@/modules/clients/types'

const initialState: CreateSessionState = {}

interface Props {
  clients: ClientRecord[]
  defaultClientId?: string
}

export function CreateSessionForm({ clients, defaultClientId }: Props) {
  const [state, action, pending] = useActionState(createSessionAction, initialState)

  // Standarddatum: heute, aktuelle Stunde gerundet
  const now = new Date()
  now.setMinutes(0, 0, 0)
  const defaultDate = now.toISOString().slice(0, 16) // "YYYY-MM-DDTHH:mm"

  return (
    <form action={action} className="space-y-5">
      {state.errors?.general && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.errors.general[0]}
        </div>
      )}

      {/* Klient */}
      <div>
        <label htmlFor="clientId" className="block text-sm font-medium text-zinc-700 mb-1.5">
          Klient <span className="text-red-500">*</span>
        </label>
        {clients.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Noch kein Klient angelegt.{' '}
            <a href="/clients/new" className="text-zinc-900 underline">Jetzt anlegen →</a>
          </p>
        ) : (
          <select
            id="clientId"
            name="clientId"
            defaultValue={defaultClientId ?? ''}
            required
            disabled={pending}
            className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
          >
            <option value="" disabled>Klient wählen …</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.personal_data?.name || c.display_label}
              </option>
            ))}
          </select>
        )}
        {state.errors?.clientId && (
          <p className="mt-1.5 text-xs text-red-600">{state.errors.clientId[0]}</p>
        )}
      </div>

      {/* Sitzungstyp */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-zinc-700 mb-1.5">
          Sitzungstyp <span className="text-red-500">*</span>
        </label>
        <select
          id="type"
          name="type"
          defaultValue="individual"
          required
          disabled={pending}
          className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
        >
          {Object.entries(SESSION_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {state.errors?.type && (
          <p className="mt-1.5 text-xs text-red-600">{state.errors.type[0]}</p>
        )}
      </div>

      {/* Datum & Uhrzeit */}
      <div>
        <label htmlFor="sessionDate" className="block text-sm font-medium text-zinc-700 mb-1.5">
          Datum & Uhrzeit <span className="text-red-500">*</span>
        </label>
        <input
          id="sessionDate"
          name="sessionDate"
          type="datetime-local"
          defaultValue={defaultDate}
          required
          disabled={pending}
          className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
        />
        {state.errors?.sessionDate && (
          <p className="mt-1.5 text-xs text-red-600">{state.errors.sessionDate[0]}</p>
        )}
      </div>

      {/* Dauer */}
      <div>
        <label htmlFor="durationMinutes" className="block text-sm font-medium text-zinc-700 mb-1.5">
          Dauer
          <span className="ml-1.5 text-xs font-normal text-zinc-400">(Minuten, optional)</span>
        </label>
        <input
          id="durationMinutes"
          name="durationMinutes"
          type="number"
          min={1}
          max={600}
          step={5}
          placeholder="50"
          disabled={pending}
          className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
        />
      </div>

      {/* Notizen */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-zinc-700 mb-1.5">
          Notizen
          <span className="ml-1.5 text-xs font-normal text-zinc-400">(vor KI-Auswertung, intern)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          placeholder="Stichworte, Beobachtungen, erste Eindrücke …"
          disabled={pending}
          className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-50 resize-none"
        />
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending || clients.length === 0}
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Wird angelegt…' : 'Sitzung anlegen'}
        </button>
        <a href="/sessions" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
          Abbrechen
        </a>
      </div>
    </form>
  )
}
