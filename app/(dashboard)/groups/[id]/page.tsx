import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Users, Euro, CalendarDays } from 'lucide-react'
import { getCourseById, getCourseSessionsForCourse, getCourseParticipants } from '@/modules/courses/queries'
import { getClients } from '@/modules/clients/queries'
import { ParticipantsPanel } from './participants-panel'

const TYPE_LABELS: Record<string, string> = {
  course:   'Kurs',
  seminar:  'Seminar',
  workshop: 'Workshop',
  group:    'Gruppe',
}

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  draft:     'bg-zinc-100 text-zinc-500',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
}

const STATUS_LABELS: Record<string, string> = {
  active:    'Aktiv',
  draft:     'Entwurf',
  cancelled: 'Abgesagt',
  completed: 'Abgeschlossen',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

function durationMin(starts: string, ends: string): number {
  return Math.round((new Date(ends).getTime() - new Date(starts).getTime()) / 60000)
}

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [course, sessions, participants, clients] = await Promise.all([
    getCourseById(id),
    getCourseSessionsForCourse(id),
    getCourseParticipants(id),
    getClients(),
  ])

  if (!course) notFound()

  const now              = new Date()
  const activeParticipants = participants.filter(p => p.status !== 'cancelled')

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/groups"
        className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Gruppen & Kurse
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                {TYPE_LABELS[course.type] ?? course.type}
              </span>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[course.status] ?? 'bg-zinc-100 text-zinc-500'}`}>
                {STATUS_LABELS[course.status] ?? course.status}
              </span>
            </div>
            <h1 className="text-xl font-bold text-zinc-900">{course.title}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-1.5 text-sm text-zinc-500">
              {course.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {course.location}
                </span>
              )}
              {course.price && (
                <span className="flex items-center gap-1">
                  <Euro className="h-3.5 w-3.5" />
                  {parseFloat(course.price).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                </span>
              )}
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {sessions.length} {sessions.length === 1 ? 'Termin' : 'Termine'}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {activeParticipants.length}
                {course.max_participants ? `/${course.max_participants}` : ''} Teilnehmer
              </span>
            </div>
            {course.description && (
              <p className="mt-3 text-sm text-zinc-600">{course.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Termine + Teilnehmer nebeneinander */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sessions */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-zinc-700">
              Termine ({sessions.length})
            </h2>
            <span className="text-xs text-zinc-400">
              {sessions.filter(s => new Date(s.ends_at) > now).length} anstehend
            </span>
          </div>
          {sessions.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-zinc-400">Keine Termine vorhanden.</p>
          ) : (
            <div className="max-h-96 divide-y divide-zinc-100 overflow-y-auto">
              {sessions.map(s => {
                const past = new Date(s.ends_at) < now
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 px-5 py-3 ${past ? 'opacity-60' : ''}`}
                  >
                    <div className={`h-2 w-2 shrink-0 rounded-full ${past ? 'bg-zinc-300' : 'bg-violet-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${past ? 'text-zinc-500' : 'text-zinc-800'}`}>
                        {formatDate(s.starts_at)}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {formatTime(s.starts_at)} – {formatTime(s.ends_at)}
                        {' · '}{durationMin(s.starts_at, s.ends_at)} Min
                      </p>
                    </div>
                    {past && (
                      <span className="shrink-0 text-[10px] text-zinc-400">Vergangen</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Participants (client component) */}
        <ParticipantsPanel
          courseId={course.id}
          maxParticipants={course.max_participants}
          initialParticipants={participants}
          allClients={clients}
        />
      </div>
    </div>
  )
}
