import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getServiceItemById, getTenantProfile } from '@/modules/settings/queries'
import { ServiceForm } from '../service-form'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditServicePage({ params }: Props) {
  const { id } = await params
  const [item, tenantProfile] = await Promise.all([
    getServiceItemById(id),
    getTenantProfile(),
  ])
  if (!item) notFound()

  return (
    <div className="space-y-6 max-w-xl">
      <Link href="/settings/services" className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
        <ChevronLeft className="h-4 w-4" />
        Zurück zu Leistungen
      </Link>
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Leistung bearbeiten</h2>
        <p className="text-sm text-zinc-500">{item.name}</p>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <ServiceForm item={item} tenantProfile={tenantProfile} />
      </div>
    </div>
  )
}
