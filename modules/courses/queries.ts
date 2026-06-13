import { createClient } from '@/lib/supabase/server'
import type { Course, CourseSession, CourseParticipant } from './types'

export async function getCourses(): Promise<Course[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('courses')
    .select(`*, course_sessions(id, starts_at), course_participants(id, status)`)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) { console.error('getCourses error:', error); return [] }
  return (data ?? []) as Course[]
}

export async function getCourseById(id: string): Promise<Course | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) { console.error('getCourseById error:', error); return null }
  return data as Course
}

export async function getCourseSessionsForCourse(courseId: string): Promise<CourseSession[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('course_sessions')
    .select('*')
    .eq('course_id', courseId)
    .is('deleted_at', null)
    .order('starts_at', { ascending: true })

  if (error) { console.error('getCourseSessionsForCourse error:', error); return [] }
  return (data ?? []) as CourseSession[]
}

export async function getCourseParticipants(courseId: string): Promise<CourseParticipant[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('course_participants')
    .select(`*, client:clients(id, display_label, personal_data)`)
    .eq('course_id', courseId)
    .is('deleted_at', null)
    .order('registered_at', { ascending: true })

  if (error) { console.error('getCourseParticipants error:', error); return [] }
  return (data ?? []) as CourseParticipant[]
}
