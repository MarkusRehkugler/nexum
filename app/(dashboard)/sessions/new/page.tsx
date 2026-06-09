import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getClients } from '@/modules/clients/queries'
import { CreateSessionForm } from './create-session-form'

interface Props {
  searchParams: Promise<{ clientId?: string }>
}

export default async function NewSessionPage({ searchParams }: Props) {
  const { clientId } = await searchParams
  const clients = await getClients()

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link
        href="/sessions"
        className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Zurück zu Sitzungen
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Neue Sitzung</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Nach dem Anlegen kannst du die Audioaufnahme starten und das KI-Protokoll generieren.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <CreateSessionForm clients={clients} defaultClientId={clientId} />
      </div>
    </div>
  )
}
