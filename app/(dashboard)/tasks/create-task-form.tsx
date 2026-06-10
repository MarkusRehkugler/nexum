'use client'

import { useActionState, useEffect } from 'react'
import { createManualTaskAction } from '@/modules/tasks/actions'
import { X } from 'lucide-react'

interface Client {
  id: string
  display_label: string
  personal_data: { name?: string } | null
}

interface Props {
  clients: Client[]
  onClose: () => void
}

const initial: { error?: string; success?: boolean } = {}

export function CreateTaskForm({ clients, onClose }: Props) {
  const [state, action, pending] = useActionState(createManualTaskAction, initial)

  useEffect(() => {
    if (state.success) onClose()
  }, [state.success, onClose])

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-800">Neue Aufgabe</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form action={action} className="space-y-4">
        {state.error && (
          <p className="text-xs text-red-600">{state.error}</p>
        )}

        {/* Beschreibung */}
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">
            Beschreibung <span className="text-red-500">*</span>
          </label>
          <textarea
            name="content"
            rows={2}
            required
            placeholder="Was ist zu tun?"
            className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 resize-none"
            disabled={pending}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Klient (optional) */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Klient (optional)</label>
            <select
              name="client_id"
              className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-200"
              disabled={pending}
            >
              <option value="">—</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.personal_data?.name ?? c.display_label}
                </option>
              ))}
            </select>
          </div>

          {/* Priorität */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Priorität</label>
            <select
              name="priority"
              defaultValue="medium"
              className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-200"
              disabled={pending}
            >
              <option value="high">Hoch</option>
              <option value="medium">Mittel</option>
              <option value="low">Niedrig</option>
            </select>
          </div>

          {/* Fälligkeitsdatum */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Fällig am</label>
            <input
              type="date"
              name="due_date"
              className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-200"
              disabled={pending}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {pending ? 'Speichern…' : 'Aufgabe anlegen'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  )
}
