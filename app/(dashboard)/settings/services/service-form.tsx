'use client'

import { useRouter } from 'next/navigation'
import { UNIT_OPTIONS } from '@/modules/settings/types'
import type { ServiceItem, TenantProfile } from '@/modules/settings/types'
import { createServiceItemAction, updateServiceItemAction } from '@/modules/settings/actions'

interface Props {
  item?: ServiceItem
  tenantProfile: TenantProfile | null
}

export function ServiceForm({ item, tenantProfile }: Props) {
  const router = useRouter()
  const taxMode = tenantProfile?.tax_mode ?? null

  async function handleSubmit(formData: FormData) {
    if (item) {
      await updateServiceItemAction(item.id, formData)
    } else {
      await createServiceItemAction(formData)
    }
    router.push('/settings/services')
    router.refresh()
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Name *</label>
        <input name="name" required defaultValue={item?.name ?? ''}
          placeholder="z. B. Einzelsitzung 60 Min"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Beschreibung</label>
        <input name="description" defaultValue={item?.description ?? ''}
          placeholder="Erscheint als Positionstext auf der Rechnung"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Preis (€) *</label>
          <input name="unit_price" type="number" step="0.01" min="0" required
            defaultValue={item?.unit_price ?? ''}
            placeholder="0.00"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Einheit</label>
          <select name="unit" defaultValue={item?.unit ?? 'Sitzung'}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white">
            {UNIT_OPTIONS.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Umsatzsteuer — nur anzeigen wenn nicht Kleinunternehmer */}
      {taxMode === 'kleinunternehmer' ? (
        <input type="hidden" name="tax_rate" value="0" />
      ) : taxMode === 'steuerfrei_heilpraktiker' ? (
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Umsatzsteuer</label>
          <select name="tax_rate" defaultValue={String(item?.tax_rate ?? 0)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white">
            <option value="0">0% — Steuerbefreit §4 Nr. 14 (Heilberufe)</option>
            <option value="19">19% — Regelbesteuerung</option>
          </select>
        </div>
      ) : taxMode === 'regelbesteuerung_19' ? (
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Umsatzsteuer</label>
          <select name="tax_rate" defaultValue={String(item?.tax_rate ?? 19)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white">
            <option value="19">19% — Regelbesteuerung</option>
            <option value="7">7% — Ermäßigter Steuersatz</option>
            <option value="0">0% — Steuerbefreit</option>
          </select>
        </div>
      ) : (
        /* Profil noch nicht gespeichert — neutrale Auswahl */
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Umsatzsteuer</label>
          <select name="tax_rate" defaultValue={String(item?.tax_rate ?? 0)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white">
            <option value="0">0% — Steuerbefreit / Kleinunternehmer §19</option>
            <option value="19">19% — Regelbesteuerung</option>
          </select>
          <p className="mt-1 text-xs text-zinc-400">Zuerst in Stammdaten die Umsatzsteuer-Einstellung hinterlegen.</p>
        </div>
      )}

      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" name="is_default" value="true"
          defaultChecked={item?.is_default ?? false}
          className="h-4 w-4 rounded accent-zinc-900" />
        <span className="text-sm text-zinc-700">Standardmäßig auf neuen Rechnungen vorausfüllen</span>
      </label>

      <div className="flex gap-3 pt-2">
        <button type="submit"
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 transition-colors">
          {item ? 'Speichern' : 'Leistung anlegen'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="rounded-lg border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors">
          Abbrechen
        </button>
      </div>
    </form>
  )
}
