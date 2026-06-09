import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { CreateClientForm } from './create-client-form'

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/clients"
        className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Zurück zur Klientenliste
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Neuen Klienten anlegen</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Nur Name ist Pflicht. Alle Angaben sind intern und DSGVO-konform gespeichert.
        </p>
      </div>

      {/* Formular-Card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <CreateClientForm />
      </div>
    </div>
  )
}
