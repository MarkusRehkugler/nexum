import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Clock, User, AlignLeft, Calendar, Mail } from 'lucide-react'
import { getCalendarEntryById } from '@/modules/calendar/queries'
import { getTenantProfile } from '@/modules/settings/queries'
import { TYPE_LABELS, TYPE_COLORS } from '@/modules/calendar/schemas'
import { buildAppointmentConfirmationMailtoUrl, buildAppointmentReminderMailtoUrl } from '@/modules/email/compose'
import { AppointmentActions } from './appointment-actions'

interface Props {
  params: Promise<{ id: string }>
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function durationMinutes(startsAt: string, endsAt: string): number {
  return Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60000)
}

export default async function AppointmentDetailPage({ params }: Props) {
  const { id } = await params
  const [entry, profile] = await Promise.all([
    getCalendarEntryById(id),
    getTenantProfile(),
  ])

  if (!entry) notFound()

  const clientName = entry.client?.personal_data?.name ?? entry.client?.display_label
  const clientEmail = entry.client?.personal_data?.email as string | undefined
  const duration = durationMinutes(entry.starts_at, entry.ends_at)
  const typeClass = TYPE_COLORS[entry.type] ?? TYPE_COLORS.event
  const typeLabel = TYPE_LABELS[entry.type] ?? entry.type

  const senderName = [profile?.company_name, profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}` : null]
    .filter(Boolean).join(' · ') || 'Ihre Praxis'

  const confirmationMailtoUrl = clientEmail && clientName ? buildAppointmentConfirmationMailtoUrl({
    to: clientEmail,
    clientName,
    title: entry.title,
    typeLabel,
    dateTime: formatDateTime(entry.starts_at),
    endTime: formatTime(entry.ends_at),
    durationMinutes: duration,
    senderName,
  }) : undefined

  const reminderMailtoUrl = clientEmail && clientName ? buildAppointmentReminderMailtoUrl({
    to: clientEmail,
    clientName,
    title: entry.title,
    dateTime: formatDateTime(entry.starts_at),
    endTime: formatTime(entry.ends_at),
    senderName,
  }) : undefined

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <Link href="/calendar" className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Kalender
        </Link>
        <AppointmentActions
          appointmentId={entry.id}
          clientId={entry.client_id}
          sessionId={entry.session_id}
          startsAt={entry.starts_at}
          durationMinutes={duration}
        />
      </div>

      {/* E-Mail-Aktionen */}
      {(confirmationMailtoUrl || reminderMailtoUrl) && (
        <div className="flex items-center gap-2">
          {confirmationMailtoUrl && (
            <a
              href={confirmationMailtoUrl}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-300 hover:shadow-sm transition-all"
            >
              <Mail className="h-4 w-4" />
              Bestätigung senden
            </a>
          )}
          {reminderMailtoUrl && (
            <a
              href={reminderMailtoUrl}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-300 hover:shadow-sm transition-all"
            >
              <Mail className="h-4 w-4" />
              Erinnerung senden
            </a>
          )}
        </div>
      )}

      {/* Detail-Karte */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-start gap-3">
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${typeClass}`}>
            {typeLabel}
          </span>
          {entry.session_id && (
            <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-200">
              Sitzung verknüpft
            </span>
          )}
        </div>

        <h1 className="text-2xl font-semibold text-zinc-900">{entry.title}</h1>

        <dl className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-zinc-400 shrink-0" />
            <div>
              <span className="text-zinc-900 font-medium">{formatDateTime(entry.starts_at)}</span>
              <span className="mx-1.5 text-zinc-400">–</span>
              <span className="text-zinc-500">{formatTime(entry.ends_at)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 text-zinc-400 shrink-0" />
            <span className="text-zinc-700">{duration} Minuten</span>
          </div>

          {clientName && (
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-zinc-400 shrink-0" />
              <Link
                href={`/clients/${entry.client_id}`}
                className="text-zinc-900 font-medium hover:text-violet-600 transition-colors"
              >
                {clientName}
              </Link>
            </div>
          )}

          {entry.description && (
            <div className="flex items-start gap-3 text-sm">
              <AlignLeft className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
              <p className="text-zinc-600 whitespace-pre-wrap">{entry.description}</p>
            </div>
          )}
        </dl>
      </div>
    </div>
  )
}
