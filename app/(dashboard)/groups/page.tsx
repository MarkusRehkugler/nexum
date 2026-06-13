import Link from 'next/link'
import { Plus, Users, CalendarDays, ChevronRight, MapPin, Euro } from 'lucide-react'
import { getCourses } from '@/modules/courses/queries'
import type { Course } from '@/modules/courses/types'

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

function nextSessionDate(course: Course): string | null {
  const now = new Date()
  const upcoming = (course.course_sessions ?? [])
    .filter(s => new Date(s.starts_at) > now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
  return upcoming[0]?.starts_at ?? null
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function CourseCard({ course }: { course: Course }) {
  const sessions     = course.course_sessions ?? []
  const participants = (course.course_participants ?? []).filter(p => p.status !== 'cancelled')
  const nextSession  = nextSessionDate(course)
  const isFull       = course.max_participants != null && participants.length >= course.max_participants

  return (
    <Link
      href={`/groups/${course.id}`}
      className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white px-5 py-4 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all group"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100">
        <Users className="h-5 w-5 text-violet-600" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-zinc-900 truncate">{course.title}</span>
          <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">
            {TYPE_LABELS[course.type] ?? course.type}
          </span>
          <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_COLORS[course.status] ?? 'bg-zinc-100 text-zinc-500'}`}>
            {STATUS_LABELS[course.status] ?? course.status}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-400 flex-wrap">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {sessions.length} {sessions.length === 1 ? 'Termin' : 'Termine'}
            {nextSession
              ? ` · nächster: ${formatDate(nextSession)}`
              : sessions.length > 0 ? ' · alle vergangen' : ''}
          </span>
          <span className={`flex items-center gap-1 ${isFull ? 'text-amber-500' : ''}`}>
            <Users className="h-3 w-3" />
            {participants.length}{course.max_participants ? `/${course.max_participants}` : ''} Teilnehmer
            {isFull && ' · ausgebucht'}
          </span>
          {course.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {course.location}
            </span>
          )}
          {course.price && (
            <span className="flex items-center gap-1">
              <Euro className="h-3 w-3" />
              {parseFloat(course.price).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
            </span>
          )}
        </div>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
    </Link>
  )
}

export default async function GroupsPage() {
  const courses = await getCourses()

  const active   = courses.filter(c => c.status === 'active' || c.status === 'draft')
  const archived = courses.filter(c => c.status === 'completed' || c.status === 'cancelled')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Gruppen & Kurse</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Kurse, Seminare, Workshops und Gruppen</p>
        </div>
        <Link
          href="/groups/new"
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Neue Veranstaltung
        </Link>
      </div>

      {courses.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-50">
            <Users className="h-6 w-6 text-violet-400" />
          </div>
          <p className="text-sm font-medium text-zinc-700">Noch keine Veranstaltungen</p>
          <p className="mt-1 text-xs text-zinc-400">
            Lege Kurse, Seminare oder Gruppenveranstaltungen an und verwalte Anmeldungen.
          </p>
          <Link
            href="/groups/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Erste Veranstaltung anlegen
          </Link>
        </div>
      )}

      {active.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-3">Aktiv</h2>
          <div className="space-y-2">
            {active.map(c => <CourseCard key={c.id} course={c} />)}
          </div>
        </section>
      )}

      {archived.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-3">Archiv</h2>
          <div className="space-y-2">
            {archived.map(c => <CourseCard key={c.id} course={c} />)}
          </div>
        </section>
      )}
    </div>
  )
}
