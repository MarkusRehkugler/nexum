import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { getClientById } from '@/modules/clients/queries'
import { EditClientForm } from './edit-client-form'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditClientPage({ params }: Props) {
  const { id } = await params
  const client = await getClientById(id)
  if (!client) notFound()

  const pd = client.personal_data as unknown as Record<string, string>

  const defaults = {
    salutation:              pd.salutation              ?? '',
    first_name:              pd.first_name              ?? '',
    last_name:               pd.last_name               ?? pd.name ?? '',
    birth_date:              pd.birth_date              ?? '',
    email:                   pd.email                   ?? '',
    phone_mobile:            pd.phone_mobile            ?? pd.phone ?? '',
    phone_landline:          pd.phone_landline          ?? '',
    emergency_contact_name:  pd.emergency_contact_name  ?? '',
    emergency_contact_phone: pd.emergency_contact_phone ?? '',
    notes:                   pd.notes                   ?? '',
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/clients/${id}`}
        className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Zurück zur Klientenakte
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Klient bearbeiten</h1>
        <p className="mt-1 text-sm text-zinc-400">{pd.name || client.display_label}</p>
      </div>

      <EditClientForm clientId={id} defaults={defaults} />
    </div>
  )
}
