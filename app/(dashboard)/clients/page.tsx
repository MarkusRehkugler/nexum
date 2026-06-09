import Link from 'next/link'
import { getClients } from '@/modules/clients/queries'
import { UserPlus, Users } from 'lucide-react'

function statusLabel(status: string) {
  switch (status) {
    case 'active': return 'Aktiv'
    case 'inactive': return 'Inaktiv'
    case 'archived': return 'Archiviert'
    default: return status
  }
}

function statusClass(status: string) {
  switch (status) {
    case 'active': return 'bg-green-50 text-green-700 ring-green-600/20'
    case 'inactive': return 'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
    case 'archived': return 'bg-zinc-100 text-zinc-500 ring-zinc-500/20'
    default: return 'bg-zinc-100 text-zinc-500'
  }
}

export default async function ClientsPage() {
  const clients = await getClients()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Klienten</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {clients.length === 0
              ? 'Noch keine Klienten angelegt.'
              : `${clients.length} Klient${clients.length !== 1 ? 'en' : ''}`}
          </p>
        </div>
        <Link
          href="/clients/new"
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-700 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Neuer Klient
        </Link>
      </div>

      {/* Leerzustand */}
      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white py-16 text-center">
          <Users className="mb-3 h-8 w-8 text-zinc-300" />
          <p className="text-sm font-medium text-zinc-600">Noch keine Klienten</p>
          <p className="mt-1 text-xs text-zinc-400">
            Lege deinen ersten Klienten an, um loszulegen.
          </p>
          <Link
            href="/clients/new"
            className="mt-4 flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Ersten Klienten anlegen
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead>
              <tr className="bg-zinc-50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Name
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  E-Mail
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Telefon
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Angelegt
                </th>
                <th className="relative px-5 py-3">
                  <span className="sr-only">Öffnen</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {clients.map((client) => {
                const pd = client.personal_data
                const date = new Date(client.created_at).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })
                return (
                  <tr
                    key={client.id}
                    className="hover:bg-zinc-50 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-sm font-medium text-zinc-900">
                      <Link href={`/clients/${client.id}`} className="hover:underline">
                        {pd.name || client.display_label}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-zinc-500">
                      {pd.email ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-zinc-500">
                      {pd.phone ?? '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusClass(client.status)}`}
                      >
                        {statusLabel(client.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-zinc-400">{date}</td>
                    <td className="px-5 py-3.5 text-right text-sm">
                      <Link
                        href={`/clients/${client.id}`}
                        className="font-medium text-zinc-900 hover:text-zinc-600"
                      >
                        Öffnen →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
