export type CalendarEntryType = 'session' | 'block' | 'event' | 'reminder'

export interface CalendarEntry {
  id: string
  tenant_id: string
  user_id: string
  session_id: string | null
  client_id: string | null
  type: CalendarEntryType
  title: string
  description: string | null
  starts_at: string   // ISO timestamp
  ends_at: string     // ISO timestamp
  recurrence_rule: string | null
  external_sync_id: string | null
  external_provider: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  // Joined
  client?: {
    id: string
    display_label: string
    personal_data?: { name?: string; email?: string }
  } | null
}

export interface CalendarEntryWithClient extends CalendarEntry {
  client: {
    id: string
    display_label: string
    personal_data?: { name?: string; email?: string }
  } | null
}
