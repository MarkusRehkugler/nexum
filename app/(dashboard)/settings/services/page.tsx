import Link from 'next/link'
import { Plus, Star } from 'lucide-react'
import { getServiceItems } from '@/modules/settings/queries'
import { ServiceItemRow } from './service-item-row'

export default async function ServicesSettingsPage() {
  const items = await getServiceItems()

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Leistungskatalog</h2>
          <p className="text-sm text-zinc-500">Vorlagen für Rechnungspositionen</p>
        </div>
        <Link href="/settings/services/new"
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors">
          <Plus className="h-4 w-4" />
          Neue Leistung
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-10 text-center">
          <p className="text-sm text-zinc-500">Noch keine Leistungen angelegt.</p>
          <Link href="/settings/services/new"
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-zinc-900 hover:underline">
            <Plus className="h-4 w-4" />
            Erste Leistung anlegen
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm divide-y divide-zinc-100">
          {items.map(item => (
            <ServiceItemRow key={item.id} item={item} />
          ))}
        </div>
      )}

      <p className="text-xs text-zinc-400">
        Mit <Star className="inline h-3 w-3" /> markierte Leistungen werden beim Erstellen einer Rechnung vorausgewählt.
      </p>
    </div>
  )
}
