'use client'

import { useActionState } from 'react'
import { updateClientAction, type UpdateClientState } from '@/modules/clients/actions'

interface Defaults {
  salutation: string
  first_name: string
  last_name: string
  birth_date: string
  email: string
  phone_mobile: string
  phone_landline: string
  emergency_contact_name: string
  emergency_contact_phone: string
  notes: string
}

interface Props {
  clientId: string
  defaults: Defaults
}

const initialState: UpdateClientState = {}

const fieldClass = 'block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-50'
const labelClass = 'block text-sm font-medium text-zinc-700 mb-1.5'

export function EditClientForm({ clientId, defaults }: Props) {
  const boundAction = updateClientAction.bind(null, clientId)
  const [state, action, pending] = useActionState(boundAction, initialState)

  return (
    <form action={action} className="space-y-6">
      {state.errors?.general && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.errors.general[0]}
        </div>
      )}

      {/* Persönliche Daten */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-zinc-700">Persönliche Daten</h2>

        <div>
          <label htmlFor="salutation" className={labelClass}>Anrede</label>
          <select id="salutation" name="salutation" disabled={pending} defaultValue={defaults.salutation} className={fieldClass}>
            <option value="">—</option>
            <option value="Frau">Frau</option>
            <option value="Herr">Herr</option>
            <option value="Divers">Divers</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className={labelClass}>Vorname</label>
            <input
              id="first_name" name="first_name" type="text" autoComplete="off"
              defaultValue={defaults.first_name}
              className={fieldClass} disabled={pending}
            />
          </div>
          <div>
            <label htmlFor="last_name" className={labelClass}>
              Nachname <span className="text-red-500">*</span>
            </label>
            <input
              id="last_name" name="last_name" type="text" required autoComplete="off"
              defaultValue={defaults.last_name}
              className={fieldClass} disabled={pending}
              aria-describedby={state.errors?.last_name ? 'last-name-error' : undefined}
            />
            {state.errors?.last_name && (
              <p id="last-name-error" className="mt-1.5 text-xs text-red-600">{state.errors.last_name[0]}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="birth_date" className={labelClass}>Geburtsdatum</label>
          <input
            id="birth_date" name="birth_date" type="date"
            defaultValue={defaults.birth_date}
            className={fieldClass} disabled={pending}
          />
        </div>
      </section>

      {/* Kontakt */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-zinc-700">Kontakt</h2>

        <div>
          <label htmlFor="email" className={labelClass}>E-Mail</label>
          <input
            id="email" name="email" type="email" autoComplete="off"
            defaultValue={defaults.email}
            className={fieldClass} disabled={pending}
            aria-describedby={state.errors?.email ? 'email-error' : undefined}
          />
          {state.errors?.email && (
            <p id="email-error" className="mt-1.5 text-xs text-red-600">{state.errors.email[0]}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone_mobile" className={labelClass}>Mobil</label>
            <input
              id="phone_mobile" name="phone_mobile" type="tel" autoComplete="off"
              defaultValue={defaults.phone_mobile}
              className={fieldClass} disabled={pending}
            />
          </div>
          <div>
            <label htmlFor="phone_landline" className={labelClass}>Festnetz</label>
            <input
              id="phone_landline" name="phone_landline" type="tel" autoComplete="off"
              defaultValue={defaults.phone_landline}
              className={fieldClass} disabled={pending}
            />
          </div>
        </div>
      </section>

      {/* Notfallkontakt */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-zinc-700">Notfallkontakt</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="emergency_contact_name" className={labelClass}>Name</label>
            <input
              id="emergency_contact_name" name="emergency_contact_name" type="text"
              defaultValue={defaults.emergency_contact_name}
              className={fieldClass} disabled={pending}
            />
          </div>
          <div>
            <label htmlFor="emergency_contact_phone" className={labelClass}>Telefon</label>
            <input
              id="emergency_contact_phone" name="emergency_contact_phone" type="tel"
              defaultValue={defaults.emergency_contact_phone}
              className={fieldClass} disabled={pending}
            />
          </div>
        </div>
      </section>

      {/* Anmerkungen */}
      <div>
        <label htmlFor="notes" className={labelClass}>
          Anmerkungen
          <span className="ml-1.5 text-xs font-normal text-zinc-400">(intern)</span>
        </label>
        <textarea
          id="notes" name="notes" rows={3}
          defaultValue={defaults.notes}
          className={`${fieldClass} resize-none`}
          disabled={pending}
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit" disabled={pending}
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Wird gespeichert…' : 'Speichern'}
        </button>
        <a
          href={`/clients/${clientId}`}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          Abbrechen
        </a>
      </div>
    </form>
  )
}
