'use client'

import { useActionState } from 'react'
import { saveTenantProfileAction } from '@/modules/settings/actions'
import { TAX_MODE_LABELS } from '@/modules/settings/types'
import type { TenantProfile } from '@/modules/settings/types'
import { CheckCircle2, AlertCircle } from 'lucide-react'

interface Props {
  profile: TenantProfile | null
}

export function ProfileForm({ profile }: Props) {
  const [state, action, pending] = useActionState(saveTenantProfileAction, {})

  return (
    <form action={action} className="space-y-8 max-w-2xl">
      {state.success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Gespeichert
        </div>
      )}
      {state.error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}

      {/* Kontaktdaten */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-zinc-900">Absender & Kontakt</h2>
        <p className="text-xs text-zinc-400">Erscheint auf Rechnungen als Absenderadresse.</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-zinc-700 mb-1">Praxis / Firmenname</label>
            <input name="company_name" defaultValue={profile?.company_name ?? ''} placeholder="z. B. Praxis Müller"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Vorname</label>
            <input name="first_name" defaultValue={profile?.first_name ?? ''}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Nachname</label>
            <input name="last_name" defaultValue={profile?.last_name ?? ''}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Straße & Hausnummer</label>
          <input name="street" defaultValue={profile?.street ?? ''}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">PLZ</label>
            <input name="zip" defaultValue={profile?.zip ?? ''}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-zinc-700 mb-1">Ort</label>
            <input name="city" defaultValue={profile?.city ?? ''}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Telefon</label>
            <input name="phone" defaultValue={profile?.phone ?? ''}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">E-Mail (Rechnungen)</label>
            <input name="email" type="email" defaultValue={profile?.email ?? ''}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
        </div>
      </section>

      {/* Umsatzsteuer */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-zinc-900">Umsatzsteuer</h2>
        <div className="space-y-2">
          {(Object.entries(TAX_MODE_LABELS) as [string, string][]).map(([value, label]) => (
            <label key={value} className="flex items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 cursor-pointer hover:bg-zinc-50">
              <input type="radio" name="tax_mode" value={value}
                defaultChecked={(profile?.tax_mode ?? 'kleinunternehmer') === value}
                className="accent-zinc-900" />
              <span className="text-sm text-zinc-700">{label}</span>
            </label>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Steuernummer</label>
            <input name="tax_id" defaultValue={profile?.tax_id ?? ''} placeholder="12/345/67890"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">USt-IdNr (optional)</label>
            <input name="vat_id" defaultValue={profile?.vat_id ?? ''} placeholder="DE123456789"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
        </div>
      </section>

      {/* Bankdaten */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-zinc-900">Bankverbindung</h2>
        <p className="text-xs text-zinc-400">Erscheint im Rechnungs-Fußbereich.</p>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Bank</label>
          <input name="bank_name" defaultValue={profile?.bank_name ?? ''}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">IBAN</label>
            <input name="iban" defaultValue={profile?.iban ?? ''} placeholder="DE89 3704 0044 0532 0130 00"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">BIC</label>
            <input name="bic" defaultValue={profile?.bic ?? ''} placeholder="COBADEFFXXX"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
        </div>
      </section>

      {/* Rechnungseinstellungen */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-zinc-900">Rechnungseinstellungen</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Rechnungs-Präfix</label>
            <input name="invoice_prefix" defaultValue={profile?.invoice_prefix ?? 'RE'}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
            <p className="mt-1 text-xs text-zinc-400">z. B. RE → RE-2025-001</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Zahlungsziel (Tage)</label>
            <input name="payment_terms_days" type="number" min="0" max="90"
              defaultValue={profile?.payment_terms_days ?? 14}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Standard-Fußnotentext</label>
          <textarea name="invoice_notes" rows={3}
            defaultValue={profile?.invoice_notes ?? ''}
            placeholder="z. B. Gemäß §4 Nr. 14 UStG ist diese Leistung von der Umsatzsteuer befreit."
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none" />
        </div>
      </section>

      {/* Praxis-Einstellungen */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-zinc-900">Praxis-Einstellungen</h2>
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-zinc-700 mb-1">Klienten-Bezeichnung</label>
          <input name="client_label" defaultValue={profile?.client_label ?? 'Klient'}
            placeholder="Klient"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          <p className="mt-1 text-xs text-zinc-400">
            Wie werden deine Klienten in der App bezeichnet? z. B. „Patient", „Coachee", „Klient"
          </p>
        </div>
      </section>

      <button type="submit" disabled={pending}
        className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 transition-colors disabled:opacity-50">
        {pending ? 'Speichern…' : 'Speichern'}
      </button>
    </form>
  )
}
