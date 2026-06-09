import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getClients } from '@/modules/clients/queries'
import { CreateAppointmentForm } from './create-appointment-form'

interface Props {
  searchParams: Promise<{ clientId?: string; date?: string }>
}

export default async function NewAppointmentPage({ searchParams }: Props) {
  const { clientId, date } = await searchParams
  const clients = await getClients()

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link href="/calendar" className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
        <ChevronLeft className="h-4 w-4" />
        Zurück zum Kalender
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Neuer Termin</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Lege einen Termin an. Du kannst danach direkt eine Sitzung daraus starten.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <CreateAppointmentForm
          clients={clients}
          defaultClientId={clientId}
          defaultDate={date}
        />
      </div>
    </div>
  )
}
