export type CourseType = 'course' | 'seminar' | 'workshop' | 'group'
export type CourseStatus = 'draft' | 'active' | 'cancelled' | 'completed'
export type ParticipantStatus = 'registered' | 'waitlist' | 'cancelled'

export interface CourseSession {
  id: string
  tenant_id: string
  course_id: string
  title: string | null
  starts_at: string
  ends_at: string
  created_at: string
  deleted_at: string | null
}

export interface CourseParticipant {
  id: string
  tenant_id: string
  course_id: string
  client_id: string
  status: ParticipantStatus
  registered_at: string
  deleted_at: string | null
  client?: {
    id: string
    display_label: string
    personal_data: Record<string, unknown> | null
  }
}

export interface Course {
  id: string
  tenant_id: string
  title: string
  description: string | null
  type: CourseType
  status: CourseStatus
  max_participants: number | null
  price: string | null
  location: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  course_sessions?: Pick<CourseSession, 'id' | 'starts_at'>[]
  course_participants?: Pick<CourseParticipant, 'id' | 'status'>[]
}
