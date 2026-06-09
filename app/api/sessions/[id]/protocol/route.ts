import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateSessionProtocol } from '@/lib/ai/protocol'

interface Params {
  params: Promise<{ id: string }>
}

// POST /api/sessions/[id]/protocol
export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Session + zugehöriger Klient laden
  const { data: session } = await supabase
    .from('sessions')
    .select(`
      tenant_id, ai_processing_status,
      case:cases(
        client:clients(display_label, personal_data)
      )
    `)
    .eq('id', id)
    .single()

  if (!session) return NextResponse.json({ error: 'Sitzung nicht gefunden' }, { status: 404 })

  const admin = createAdminClient()

  // Transkript aus ai_session_results holen
  const { data: aiResult } = await admin
    .from('ai_session_results')
    .select('transcript, id')
    .eq('session_id', id)
    .single()

  if (!aiResult?.transcript) {
    return NextResponse.json(
      { error: 'Kein Transkript vorhanden — erst Transkription durchführen' },
      { status: 400 }
    )
  }

  // Status auf "processing"
  await supabase.from('sessions').update({ ai_processing_status: 'processing' }).eq('id', id)

  try {
    // Client-Name für Anonymisierung
    const caseData = session.case as unknown as { client?: { display_label?: string; personal_data?: { name?: string } } } | null
    const clientName = caseData?.client?.personal_data?.name ?? caseData?.client?.display_label

    // Profil für Coach-Name laden
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('profile')
      .eq('id', user.id)
      .single()
    const coachName = (profile?.profile as { name?: string } | null)?.name

    const protocol = await generateSessionProtocol(aiResult.transcript, clientName, coachName)

    // Protokoll in ai_session_results speichern
    const { error: updateError } = await admin
      .from('ai_session_results')
      .update({
        summary: protocol.summary,
        extracted_tasks: protocol.extractedTasks,
        suggested_followup: protocol.suggestedFollowup,
        followup_mail_draft: protocol.followupMailDraft,
        model_used: protocol.modelUsed,
        processing_seconds: protocol.processingSeconds,
      })
      .eq('id', aiResult.id)

    if (updateError) {
      throw new Error('Protokoll konnte nicht gespeichert werden')
    }

    // Status: completed
    await supabase.from('sessions').update({ ai_processing_status: 'completed' }).eq('id', id)

    return NextResponse.json({ protocol })
  } catch (err) {
    console.error('Protocol generation error:', err)
    await supabase.from('sessions').update({ ai_processing_status: 'failed' }).eq('id', id)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Protokoll-Generierung fehlgeschlagen' },
      { status: 500 }
    )
  }
}
