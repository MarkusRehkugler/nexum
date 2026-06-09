export type TaskStatus = 'open' | 'completed' | 'skipped'
export type TaskPriority = 'high' | 'medium' | 'low'
export type TaskType = 'exercise' | 'meditation' | 'audio' | 'journal' | 'reflection' | 'affirmation' | 'other'

export interface ClientTask {
  id: string
  tenant_id: string
  session_id: string | null
  client_id: string
  type: TaskType
  priority: TaskPriority
  content: string
  due_date: string | null
  status: TaskStatus
  client_response: string | null
  coach_feedback: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  // Joined
  client?: {
    id: string
    display_label: string
    personal_data?: { name?: string }
  } | null
  session?: {
    id: string
    session_date: string
  } | null
}

export interface AiExtractedTask {
  description: string
  dueHint?: string
  priority: TaskPriority
}
