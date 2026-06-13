import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ChevronLeft, Mail, Phone, FileText, Receipt, CalendarDays,
  CalendarCheck, Layers, ScrollText, Pencil,
} from 'lucide-react'
import { getClientById, getClientJournal } from '@/modules/clients/queries'
import { getDocumentsWithSignedUrls } from '@/modules/documents/queries'
import { getCarePlanForClient } from '@/modules/care-plans/queries'
import { ConsentPanel } from './consent-panel'
import { DocumentsSection } from './documents-section'
import { CarePlanPanel } from './care-plan-panel'
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

const JOURNAL_ICON = {
  appointment: CalendarCheck,
  session:     Layers,
  invoice:     ScrollText,
}

const JOURNAL_BADGE: Record<string, string> = {
  appointment: 'bg-blue-50 text-blue-700',
  session:     'bg-violet-50 text-violet-700',
  invoice:     'bg-emerald-50 text-emerald-700',
}

const JOURNAL_LABEL: Record<string, string> = {
  appointment: 'Termin',
  session:     'Sitzung',
  invoice:     'Rechnung',
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params
  const [client, documents, journal, carePlanData] = await Promise.all([
    getClientById(id),
    getDocumentsWithSignedUrls('client', id),
    getClientJournal(id),
    getCarePlanForClient(id),
  ])

  if (!client) notFound()

  const pd = client.personal_data as unknown as Record<string, string>
  const consent: ConsentRecord = {
    ...DEFAULT_CONSENT,
    ...(client.consent_records as Partial<ConsentRecord>),
  }
  const createdAt = new Date(client.created_at).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const displayName = pd.name || client.display_label
  const birthDate = pd.birth_date
    ? new Date(pd.birth_date).toLocaleDateString('de-DE', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : null

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
          {pd.salutation && (
            <p className="text-sm text-zinc-400 mb-0.5">{pd.salutation}</p>
          )}
          <h1 className="text-2xl font-semibold text-zinc-900">{displayName}</h1>
          <p className="mt-1 text-sm text-zinc-400">Angelegt am {createdAt}</p>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <Link
            href={`/clients/${id}/edit`}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 shadow-sm hover:bg-zinc-50 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Bearbeiten
          </Link>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusClass(client.status)}`}
          >
            {statusLabel(client.status)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Kontaktdaten */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">Kontakt</h2>
          <dl className="space-y-3">
            {birthDate && (
              <div className="text-sm text-zinc-700">
                <span className="text-zinc-400 text-xs mr-2">Geb.</span>{birthDate}
              </div>
            )}
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 shrink-0 text-zinc-400" />
              {pd.email
                ? <a href={`mailto:${pd.email}`} className="text-sm text-zinc-700 hover:text-zinc-900 hover:underline">{pd.email}</a>
                : <span className="text-sm text-zinc-400">—</span>
              }
            </div>
            {(pd.phone_mobile || pd.phone) && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-zinc-400" />
                <div>
                  {pd.phone_mobile && (
                    <p className="text-sm text-zinc-700">{pd.phone_mobile} <span className="text-xs text-zinc-400">Mobil</span></p>
                  )}
                  {!pd.phone_mobile && pd.phone && (
                    <p className="text-sm text-zinc-700">{pd.phone}</p>
                  )}
                </div>
              </div>
            )}
            {pd.phone_landline && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-zinc-300" />
                <p className="text-sm text-zinc-700">{pd.phone_landline} <span className="text-xs text-zinc-400">Festnetz</span></p>
              </div>
            )}
          </dl>
        </div>

        {/* Notfallkontakt + Anmerkungen */}
        <div className="space-y-4">
          {(pd.emergency_contact_name || pd.emergency_contact_phone) && (
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Notfallkontakt</h2>
              <p className="text-sm text-zinc-700">{pd.emergency_contact_name ?? '—'}</p>
              {pd.emergency_contact_phone && (
                <p className="text-sm text-zinc-500">{pd.emergency_contact_phone}</p>
              )}
            </div>
          )}
          {pd.notes && (
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Anmerkungen</h2>
              <p className="text-sm text-zinc-700 whitespace-pre-wrap">{pd.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Schnellaktionen */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: CalendarDays, label: 'Termin anlegen', href: `/calendar/new?clientId=${id}` },
          { icon: FileText,     label: 'Sitzung anlegen', href: `/sessions/new?clientId=${id}` },
          { icon: Receipt,      label: 'Rechnung erstellen', href: `/invoices/new?clientId=${id}` },
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

      {/* Begleitplan */}
      <CarePlanPanel
        clientId={id}
        caseId={carePlanData.caseId}
        initialPlan={carePlanData.carePlan}
      />

      {/* Verlauf / Journal */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-700">Verlauf</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Termine, Sitzungen und Rechnungen chronologisch</p>
        </div>
        {journal.length === 0 ? (
          <p className="px-5 py-6 text-sm text-zinc-400 text-center">Noch keine Einträge vorhanden.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {journal.map(entry => {
              const Icon = JOURNAL_ICON[entry.type]
              const date = new Date(entry.date).toLocaleDateString('de-DE', {
                day: '2-digit', month: 'short', year: 'numeric',
              })
              return (
                <li key={`${entry.type}-${entry.id}`} className="flex items-center gap-4 px-5 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium shrink-0 ${JOURNAL_BADGE[entry.type]}`}>
                    <Icon className="h-3 w-3" />
                    {JOURNAL_LABEL[entry.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <Link href={entry.href} className="text-sm font-medium text-zinc-900 hover:underline truncate block">
                      {entry.title}
                    </Link>
                    {entry.subtitle && (
                      <p className="text-xs text-zinc-400">{entry.subtitle}</p>
                    )}
                  </div>
                  <span className="text-xs text-zinc-400 shrink-0 tabular-nums">{date}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
