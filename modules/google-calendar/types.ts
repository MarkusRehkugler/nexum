export interface CalendarConnection {
  id: string
  tenant_id: string
  provider: 'google' | 'microsoft'
  access_token: string
  refresh_token: string | null
  token_expires_at: string | null
  calendar_id: string
  connected_email: string | null
  connected_at: string
}

export interface GoogleTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope: string
  id_token?: string
}

export interface GoogleUserInfo {
  email: string
  name: string
}

export interface FreeBusyPeriod {
  start: string
  end: string
}

export interface GoogleCalendarEvent {
  summary: string
  description?: string
  start: { dateTime: string; timeZone?: string }
  end: { dateTime: string; timeZone?: string }
}
