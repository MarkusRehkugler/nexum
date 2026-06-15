import { createClient } from '@/lib/supabase/server'
import type { CalendarConnection, FreeBusyPeriod, GoogleCalendarEvent, GoogleTokenResponse } from './types'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3'

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  return res.json()
}

async function getValidToken(tenantId: string): Promise<{ token: string; connection: CalendarConnection } | null> {
  const supabase = await createClient()

  // Verify the current user actually owns this tenant before fetching OAuth tokens
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.tenant_id !== tenantId) return null

  const { data: conn } = await supabase
    .from('calendar_connections')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('provider', 'google')
    .is('deleted_at', null)
    .single()

  if (!conn) return null

  const expiresAt = conn.token_expires_at ? new Date(conn.token_expires_at) : null
  const needsRefresh = !expiresAt || expiresAt.getTime() - Date.now() < 60_000

  if (needsRefresh && conn.refresh_token) {
    const refreshed = await refreshAccessToken(conn.refresh_token)
    if (!refreshed.access_token) return null

    const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
    await supabase
      .from('calendar_connections')
      .update({ access_token: refreshed.access_token, token_expires_at: newExpiry })
      .eq('id', conn.id)

    return { token: refreshed.access_token, connection: { ...conn, access_token: refreshed.access_token } }
  }

  return { token: conn.access_token, connection: conn as CalendarConnection }
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse & { error?: string; error_description?: string }> {
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/google-calendar/callback`
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  const data = await res.json()
  if (data.error) {
    console.error('[google-calendar] token exchange error:', data.error, data.error_description)
  }
  return data
}

export async function getGoogleUserEmail(accessToken: string): Promise<string | null> {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.email ?? null
}

export async function createGoogleEvent(
  tenantId: string,
  event: GoogleCalendarEvent
): Promise<string | null> {
  const result = await getValidToken(tenantId)
  if (!result) return null

  const { token, connection } = result
  const calId = encodeURIComponent(connection.calendar_id)

  const res = await fetch(`${GOOGLE_CALENDAR_BASE}/calendars/${calId}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  })

  if (!res.ok) {
    console.error('[google-calendar] createEvent error:', await res.text())
    return null
  }

  const data = await res.json()
  return data.id ?? null
}

export async function deleteGoogleEvent(tenantId: string, googleEventId: string): Promise<void> {
  const result = await getValidToken(tenantId)
  if (!result) return

  const { token, connection } = result
  const calId = encodeURIComponent(connection.calendar_id)

  const res = await fetch(`${GOOGLE_CALENDAR_BASE}/calendars/${calId}/events/${googleEventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok && res.status !== 410) {
    console.error('[google-calendar] deleteEvent error:', res.status)
  }
}

export async function getFreeBusy(
  tenantId: string,
  timeMin: string,
  timeMax: string
): Promise<FreeBusyPeriod[]> {
  const result = await getValidToken(tenantId)
  if (!result) return []

  const { token, connection } = result

  const res = await fetch(`${GOOGLE_CALENDAR_BASE}/freeBusy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      items: [{ id: connection.calendar_id }],
    }),
  })

  if (!res.ok) return []

  const data = await res.json()
  const busy: FreeBusyPeriod[] = data.calendars?.[connection.calendar_id]?.busy ?? []
  return busy
}
