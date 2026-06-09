export type SessionType = 'individual' | 'group' | 'online' | 'phone' | 'other'
export type SessionStatus = 'draft' | 'completed' | 'billed'
export type AiProcessingStatus = 'none' | 'pending' | 'processing' | 'completed' | 'failed'

export interface SessionRecord {
  id: string
  tenant_id: string
  case_id: string
  user_id: string
  type: SessionType
  session_date: string
  duration_minutes: number | null
  notes_raw: string | null
  notes_structured: Record<string, unknown> | null
  audio_storage_key: string | null
  ai_processing_status: AiProcessingStatus
  status: SessionStatus
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface SessionWithClient extends SessionRecord {
  case: {
    id: string
    client_id: string
    client: {
      id: string
      display_label: string
      personal_data: { name?: string }
    }
  }
}

export interface CreateSessionInput {
  clientId: string
  type: SessionType
  sessionDate: string   // ISO string
  durationMinutes?: number
  notes?: string
}
