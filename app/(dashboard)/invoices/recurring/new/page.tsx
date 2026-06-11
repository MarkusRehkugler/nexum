import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getClients } from '@/modules/clients/queries'
import { getServiceItems, getTenantProfile } from '@/modules/settings/queries'
import { getGebuhPositions } from '@/modules/invoices/queries'
import { CreateRecurringForm } from './create-recurring-form'

export default async function NewRecurringInvoicePage() {
  const [clients, serviceItems, tenantProfile, gebuhPositions] = await Promise.all([
    getClients(),
    getServiceItems(),
    getTenantProfile(),
    getGebuhPositions(),
  ])

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/invoices/recurring" className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
        <ChevronLeft className="h-4 w-4" />
        Wiederkehrende Rechnungen
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Neue Vorlage</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Wird automatisch im gewählten Rhythmus als Entwurf erstellt.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <CreateRecurringForm
          clients={clients}
          serviceItems={serviceItems}
          tenantProfile={tenantProfile}
          gebuhPositions={gebuhPositions}
        />
      </div>
    </div>
  )
}
