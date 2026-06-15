import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { exchangeCodeForTokens, getGoogleUserEmail } from '@/modules/google-calendar/client'

const BASE = process.env.NEXT_PUBLIC_BASE_URL!

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${BASE}/settings/calendar?error=access_denied`)
  }

  const cookieStore = await cookies()
  const savedState = cookieStore.get('google_oauth_state')?.value
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${BASE}/settings/calendar?error=invalid_state`)
  }
  cookieStore.delete('google_oauth_state')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${BASE}/login`)
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return NextResponse.redirect(`${BASE}/settings/calendar?error=no_tenant`)
  }

  const tokens = await exchangeCodeForTokens(code)
  if (!tokens.access_token) {
    const reason = tokens.error ?? 'unknown'
    return NextResponse.redirect(`${BASE}/settings/calendar?error=token_exchange&reason=${encodeURIComponent(reason)}`)
  }

  const connectedEmail = await getGoogleUserEmail(tokens.access_token)
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  await supabase
    .from('calendar_connections')
    .upsert(
      {
        tenant_id:        profile.tenant_id,
        provider:         'google',
        access_token:     tokens.access_token,
        refresh_token:    tokens.refresh_token ?? null,
        token_expires_at: expiresAt,
        calendar_id:      'primary',
        connected_email:  connectedEmail,
        connected_at:     new Date().toISOString(),
        deleted_at:       null,
      },
      { onConflict: 'tenant_id,provider' }
    )

  return NextResponse.redirect(`${BASE}/settings/calendar?connected=1`)
}
