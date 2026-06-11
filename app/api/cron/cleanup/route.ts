import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Vercel Cron: alle 10 Minuten — setzt festgefahrene KI-Jobs zurück
// CRON_SECRET muss als Env-Var in Vercel gesetzt sein
export const maxDuration = 30

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Sessions die seit mehr als 10 Minuten auf "processing" stehen → failed
  const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { data: stuck, error } = await admin
    .from('sessions')
    .update({ ai_processing_status: 'failed' })
    .eq('ai_processing_status', 'processing')
    .lt('updated_at', cutoff)
    .select('id')

  if (error) {
    console.error('cron/cleanup error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const count = stuck?.length ?? 0
  if (count > 0) console.log(`cron/cleanup: ${count} stuck job(s) reset to failed`)

  return NextResponse.json({ ok: true, reset: count })
}
