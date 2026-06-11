import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getClients } from '@/modules/clients/queries'
import { getServiceItems, getTenantProfile } from '@/modules/settings/queries'
import { getGebuhPositions, getSessionsByIds } from '@/modules/invoices/queries'
import { CreateInvoiceForm } from './create-invoice-form'

interface Props {
  searchParams: Promise<{ clientId?: string; description?: string; sessions?: string | string[] }>
}

export default async function NewInvoicePage({ searchParams }: Props) {
  const { clientId, description, sessions: sessionsParam } = await searchParams

  const sessionIds = sessionsParam
    ? (Array.isArray(sessionsParam) ? sessionsParam : [sessionsParam]).filter(Boolean)
    : []

  const [clients, serviceItems, tenantProfile, gebuhPositions, prefilledSessions] = await Promise.all([
    getClients(),
    getServiceItems(),
    getTenantProfile(),
    getGebuhPositions(),
    sessionIds.length > 0 ? getSessionsByIds(sessionIds) : Promise.resolve([]),
  ])

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/invoices" className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
        <ChevronLeft className="h-4 w-4" />
        Zurück zu Rechnungen
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Neue Rechnung</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Rechnung wird als Entwurf gespeichert — du kannst sie danach drucken oder als PDF speichern.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <CreateInvoiceForm
          clients={clients}
          serviceItems={serviceItems}
          tenantProfile={tenantProfile}
          gebuhPositions={gebuhPositions}
          defaultClientId={clientId}
          defaultDescription={description}
          prefilledSessions={prefilledSessions}
        />
      </div>
    </div>
  )
}
