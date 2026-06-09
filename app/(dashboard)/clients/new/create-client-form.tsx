'use client'

import { useActionState } from 'react'
import { createClientAction, type CreateClientState } from '@/modules/clients/actions'

const initialState: CreateClientState = {}

export function CreateClientForm() {
  const [state, action, pending] = useActionState(createClientAction, initialState)

  return (
    <form action={action} className="space-y-5">
      {/* Allgemeiner Fehler */}
      {state.errors?.general && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.errors.general[0]}
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1.5">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="off"
          placeholder="z. B. Maria Müller"
          className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
          disabled={pending}
          aria-describedby={state.errors?.name ? 'name-error' : undefined}
        />
        {state.errors?.name && (
          <p id="name-error" className="mt-1.5 text-xs text-red-600">
            {state.errors.name[0]}
          </p>
        )}
      </div>

      {/* E-Mail */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1.5">
          E-Mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="off"
          placeholder="klient@beispiel.de"
          className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
          disabled={pending}
          aria-describedby={state.errors?.email ? 'email-error' : undefined}
        />
        {state.errors?.email && (
          <p id="email-error" className="mt-1.5 text-xs text-red-600">
            {state.errors.email[0]}
          </p>
        )}
      </div>

      {/* Telefon */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-zinc-700 mb-1.5">
          Telefon
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="off"
          placeholder="+49 170 1234567"
          className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
          disabled={pending}
        />
      </div>

      {/* Notizen */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-zinc-700 mb-1.5">
          Anmerkungen
          <span className="ml-1.5 text-xs font-normal text-zinc-400">(intern, nicht für Klient sichtbar)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Erste Einschätzung, Überweisung, besondere Umstände …"
          className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-50 resize-none"
          disabled={pending}
        />
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Wird angelegt…' : 'Klient anlegen'}
        </button>
        <a
          href="/clients"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          Abbrechen
        </a>
      </div>
    </form>
  )
}
