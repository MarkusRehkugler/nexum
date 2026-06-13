'use client'

import { useState, useActionState } from 'react'
import { Loader2, Users } from 'lucide-react'
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
  { label: '180 Min (3 Std)', value: '180' },
]

const TYPES = [
  { label: 'Sitzung', value: 'session' },
  { label: 'Geblockt', value: 'block' },
  { label: 'Sonstiger Termin', value: 'event' },
  { label: 'Erinnerung', value: 'reminder' },
]

const inputCls = 'block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-50'

export function CreateAppointmentForm({ clients, defaultClientId, defaultDate }: Props) {
  const [state, action, pending] = useActionState(createCalendarEntryAction, initialState)
  const [isGroup, setIsGroup] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const today = defaultDate ?? new Date().toISOString().split('T')[0]

  function toggleClient(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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
          placeholder="z. B. Coaching-Sitzung, Achtsamkeitskurs"
          required
          disabled={pending}
          className={inputCls}
        />
        {state.errors?.title && (
          <p className="mt-1.5 text-xs text-red-600">{state.errors.title[0]}</p>
        )}
      </div>

      {/* Typ + Gruppen-Toggle */}
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <label htmlFor="type" className="block text-sm font-medium text-zinc-700 mb-1.5">
            Typ
          </label>
          <select
            id="type"
            name="type"
            defaultValue="session"
            disabled={pending}
            className={inputCls}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2.5 pb-2.5 cursor-pointer select-none">
          <div
            role="checkbox"
            aria-checked={isGroup}
            onClick={() => {
              setIsGroup(!isGroup)
              setSelectedIds(new Set())
            }}
            className={`relative h-5 w-9 rounded-full transition-colors cursor-pointer ${isGroup ? 'bg-violet-600' : 'bg-zinc-300'}`}
          >
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isGroup ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
          <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-700">
            <Users className="h-4 w-4 text-zinc-400" />
            Gruppenveranstaltung
          </span>
          {/* Hidden input so the form value is correct */}
          <input type="hidden" name="isGroupEvent" value={isGroup ? 'true' : 'false'} />
        </label>
      </div>

      {/* Klient (Einzel) oder Teilnehmer (Gruppe) */}
      {!isGroup ? (
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
            className={inputCls}
          >
            <option value="">— kein Klient —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {(c.personal_data as any)?.name || c.display_label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-zinc-700">
              Teilnehmer
              <span className="ml-1.5 text-xs font-normal text-zinc-400">
                {selectedIds.size > 0 ? `${selectedIds.size} ausgewählt` : 'optional'}
              </span>
            </label>
          </div>

          {/* Hidden inputs für ausgewählte Teilnehmer */}
          {[...selectedIds].map(id => (
            <input key={id} type="hidden" name="participantIds" value={id} />
          ))}

          {clients.length === 0 ? (
            <p className="text-sm text-zinc-400 py-2">Noch keine Klienten angelegt.</p>
          ) : (
            <div className="rounded-lg border border-zinc-200 divide-y divide-zinc-100 max-h-56 overflow-y-auto">
              {clients.map((c) => {
                const checked = selectedIds.has(c.id)
                return (
                  <label
                    key={c.id}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${checked ? 'bg-violet-50' : 'hover:bg-zinc-50'}`}
                  >
                    <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[9px] font-bold text-white transition-colors ${checked ? 'bg-violet-600 border-violet-600' : 'border-zinc-300'}`}>
                      {checked ? '✓' : ''}
                    </div>
                    <span className={`text-sm ${checked ? 'text-violet-900 font-medium' : 'text-zinc-700'}`}>
                      {(c.personal_data as any)?.name || c.display_label}
                    </span>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => toggleClient(c.id)}
                    />
                  </label>
                )
              })}
            </div>
          )}

          {/* Max. Teilnehmer */}
          <div className="mt-3">
            <label htmlFor="maxParticipants" className="block text-sm font-medium text-zinc-700 mb-1.5">
              Max. Teilnehmer
              <span className="ml-1.5 text-xs font-normal text-zinc-400">(optional)</span>
            </label>
            <input
              id="maxParticipants"
              name="maxParticipants"
              type="number"
              min={2}
              max={999}
              placeholder="z. B. 12"
              disabled={pending}
              className={`${inputCls} w-32`}
            />
          </div>
        </div>
      )}

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
            className={inputCls}
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
            className={inputCls}
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
          className={inputCls}
        >
          {DURATIONS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
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
          placeholder="z. B. Videolink, Thema, Ort …"
          disabled={pending}
          className={`${inputCls} resize-none`}
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
