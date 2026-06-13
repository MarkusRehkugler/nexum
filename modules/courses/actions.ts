'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ParticipantStatus } from './types'

export type CreateCourseState = {
  errors?: {
    title?: string[]
    type?: string[]
    date?: string[]
    general?: string[]
  }
}

function pad(n: number) { return String(n).padStart(2, '0') }
function toDateStr(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }

function generateSessions(
  scheduleType: string,
  formData: FormData,
  tenantId: string,
  courseId: string
): Array<{ tenant_id: string; course_id: string; starts_at: string; ends_at: string }> {
  if (scheduleType === 'single') {
    const date      = formData.get('date') as string
    const startTime = formData.get('startTime') as string
    const endTime   = formData.get('endTime') as string
    if (!date || !startTime || !endTime) return []
    return [{
      tenant_id: tenantId,
      course_id: courseId,
      starts_at: new Date(`${date}T${startTime}:00`).toISOString(),
      ends_at:   new Date(`${date}T${endTime}:00`).toISOString(),
    }]
  }

  if (scheduleType === 'multi_day') {
    const startDate    = formData.get('startDate') as string
    const endDate      = formData.get('endDate') as string
    const dailyStart   = formData.get('dailyStartTime') as string
    const dailyEnd     = formData.get('dailyEndTime') as string
    if (!startDate || !endDate || !dailyStart || !dailyEnd) return []

    const sessions: ReturnType<typeof generateSessions> = []
    const cur  = new Date(`${startDate}T12:00:00`)
    const last = new Date(`${endDate}T12:00:00`)
    let safety = 0
    while (cur <= last && safety++ < 100) {
      const d = toDateStr(cur)
      sessions.push({
        tenant_id: tenantId,
        course_id: courseId,
        starts_at: new Date(`${d}T${dailyStart}:00`).toISOString(),
        ends_at:   new Date(`${d}T${dailyEnd}:00`).toISOString(),
      })
      cur.setDate(cur.getDate() + 1)
    }
    return sessions
  }

  if (scheduleType === 'recurring') {
    const firstDate   = formData.get('firstDate') as string
    const lastDate    = formData.get('lastDate') as string
    const startTime   = formData.get('recurStartTime') as string
    const durationMin = parseInt((formData.get('durationMinutes') as string) || '60')
    if (!firstDate || !lastDate || !startTime) return []

    const sessions: ReturnType<typeof generateSessions> = []
    const cur   = new Date(`${firstDate}T12:00:00`)
    const last  = new Date(`${lastDate}T12:00:00`)
    let safety  = 0
    while (cur <= last && safety++ < 100) {
      const d      = toDateStr(cur)
      const starts = new Date(`${d}T${startTime}:00`)
      sessions.push({
        tenant_id: tenantId,
        course_id: courseId,
        starts_at: starts.toISOString(),
        ends_at:   new Date(starts.getTime() + durationMin * 60000).toISOString(),
      })
      cur.setDate(cur.getDate() + 7)
    }
    return sessions
  }

  return []
}

export async function createCourseAction(
  _prevState: CreateCourseState,
  formData: FormData
): Promise<CreateCourseState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { errors: { general: ['Nicht authentifiziert.'] } }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  if (!profile?.tenant_id) return { errors: { general: ['Kein Mandant gefunden.'] } }

  const title          = (formData.get('title') as string)?.trim()
  const type           = formData.get('type') as string
  const description    = (formData.get('description') as string) || null
  const location       = (formData.get('location') as string) || null
  const maxPart        = formData.get('maxParticipants') ? parseInt(formData.get('maxParticipants') as string) : null
  const price          = formData.get('price') ? parseFloat(formData.get('price') as string) : null
  const scheduleType   = formData.get('scheduleType') as string

  if (!title) return { errors: { title: ['Titel ist erforderlich.'] } }
  if (!['course', 'seminar', 'workshop', 'group'].includes(type)) {
    return { errors: { type: ['Ungültiger Typ.'] } }
  }

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .insert({
      tenant_id:       profile.tenant_id,
      title,
      type,
      description,
      location,
      max_participants: maxPart,
      price,
      status:          'active',
    })
    .select('id')
    .single()

  if (courseError || !course) {
    console.error('createCourse error:', courseError)
    return { errors: { general: ['Veranstaltung konnte nicht angelegt werden.'] } }
  }

  const sessions = generateSessions(scheduleType, formData, profile.tenant_id, course.id)
  if (sessions.length === 0) {
    return { errors: { date: ['Bitte gib mindestens einen Termin an.'] } }
  }

  const { error: sessErr } = await supabase.from('course_sessions').insert(sessions)
  if (sessErr) console.error('course_sessions insert error:', sessErr)

  redirect(`/groups/${course.id}`)
}

export async function addCourseParticipantAction(
  courseId: string,
  clientId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht authentifiziert.' }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  const { error } = await supabase
    .from('course_participants')
    .upsert(
      {
        tenant_id:     profile!.tenant_id,
        course_id:     courseId,
        client_id:     clientId,
        status:        'registered',
        deleted_at:    null,
        registered_at: new Date().toISOString(),
      },
      { onConflict: 'course_id,client_id' }
    )

  if (error) return { error: 'Teilnehmer konnte nicht hinzugefügt werden.' }
  revalidatePath(`/groups/${courseId}`)
  return {}
}

export async function removeParticipantAction(
  participantId: string,
  courseId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('course_participants')
    .update({ deleted_at: new Date().toISOString(), status: 'cancelled' })
    .eq('id', participantId)

  if (error) return { error: 'Teilnehmer konnte nicht entfernt werden.' }
  revalidatePath(`/groups/${courseId}`)
  return {}
}

export async function updateParticipantStatusAction(
  participantId: string,
  status: ParticipantStatus,
  courseId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('course_participants')
    .update({ status })
    .eq('id', participantId)

  if (error) return { error: 'Status konnte nicht aktualisiert werden.' }
  revalidatePath(`/groups/${courseId}`)
  return {}
}

export async function deleteCourseAction(courseId: string): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('courses')
    .update({ deleted_at: new Date().toISOString(), status: 'cancelled' })
    .eq('id', courseId)
  redirect('/groups')
}
