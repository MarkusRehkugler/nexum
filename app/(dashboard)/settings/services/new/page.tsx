import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getTenantProfile } from '@/modules/settings/queries'
import { ServiceForm } from '../service-form'

export default async function NewServicePage() {
  const tenantProfile = await getTenantProfile()

  return (
    <div className="space-y-6 max-w-xl">
      <Link href="/settings/services" className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
        <ChevronLeft className="h-4 w-4" />
        Zurück zu Leistungen
      </Link>
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Neue Leistung</h2>
        <p className="text-sm text-zinc-500">Vorlage für Rechnungspositionen</p>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <ServiceForm tenantProfile={tenantProfile} />
      </div>
    </div>
  )
}
