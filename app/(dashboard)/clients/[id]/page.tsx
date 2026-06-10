import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Mail, Phone, FileText, Receipt, CalendarDays } from 'lucide-react'
import { getClientById } from '@/modules/clients/queries'
import { getDocumentsWithSignedUrls } from '@/modules/documents/queries'
import { ConsentPanel } from './consent-panel'
import { DocumentsSection } from './documents-section'
import type { ConsentRecord } from '@/modules/consent/types'
import { DEFAULT_CONSENT } from '@/modules/consent/types'

interface Props {
  params: Promise<{ id: string }>
}

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

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params
  const [client, documents] = await Promise.all([
    getClientById(id),
    getDocumentsWithSignedUrls('client', id),
  ])

  if (!client) notFound()

  const pd = client.personal_data
  const consent: ConsentRecord = {
    ...DEFAULT_CONSENT,
    ...(client.consent_records as Partial<ConsentRecord>),
  }
  const createdAt = new Date(client.created_at).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/clients"
        className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Klientenliste
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">{pd.name || client.display_label}</h1>
          <p className="mt-1 text-sm text-zinc-400">Angelegt am {createdAt}</p>
        </div>
        <span
          className={`mt-1 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusClass(client.status)}`}
        >
          {statusLabel(client.status)}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Kontaktdaten */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Kontakt
          </h2>
          <dl className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 shrink-0 text-zinc-400" />
              <span className="text-sm text-zinc-700">{pd.email ?? '—'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 shrink-0 text-zinc-400" />
              <span className="text-sm text-zinc-700">{pd.phone ?? '—'}</span>
            </div>
          </dl>
        </div>

        {/* Anmerkungen */}
        {pd.notes && (
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Anmerkungen
            </h2>
            <p className="text-sm text-zinc-700 whitespace-pre-wrap">{pd.notes}</p>
          </div>
        )}
      </div>

      {/* Schnellaktionen */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: CalendarDays, label: 'Termin anlegen', href: `/calendar/new?clientId=${id}` },
          { icon: FileText, label: 'Sitzung anlegen', href: `/sessions/new?clientId=${id}` },
          { icon: Receipt, label: 'Rechnung erstellen', href: `/invoices/new?clientId=${id}` },
        ].map(({ icon: Icon, label, href }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-5 py-4 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:shadow"
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </div>

      {/* Einwilligungen (DSGVO) */}
      <ConsentPanel clientId={id} consent={consent} />

      {/* Dokumente */}
      <DocumentsSection clientId={id} initialDocuments={documents} />
    </div>
  )
}
