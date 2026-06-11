import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { transcribeAudio } from '@/lib/ai/transcribe'

export const maxDuration = 300

const BUCKET = 'session-audio'

interface Params {
  params: Promise<{ id: string }>
}

// POST /api/sessions/[id]/transcribe
export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: session } = await supabase
    .from('sessions')
    .select(`
      audio_storage_key, tenant_id, ai_processing_status,
      case:cases(client:clients(consent_records))
    `)
    .eq('id', id)
    .single()

  if (!session) return NextResponse.json({ error: 'Sitzung nicht gefunden' }, { status: 404 })

  // DSGVO Art. 9: KI-Verarbeitung nur mit expliziter Einwilligung
  const clientConsent = (session.case as unknown as {
    client?: { consent_records?: { ai_processing?: boolean } }
  } | null)?.client?.consent_records
  if (!clientConsent?.ai_processing) {
    return NextResponse.json(
      { error: 'KI-Verarbeitung nicht erlaubt — bitte zuerst die Einwilligung des Klienten dokumentieren.' },
      { status: 403 }
    )
  }

  if (!session.audio_storage_key) {
    return NextResponse.json({ error: 'Keine Aufnahme vorhanden — erst Audio hochladen' }, { status: 400 })
  }
  if (session.ai_processing_status === 'processing') {
    return NextResponse.json({ error: 'KI-Verarbeitung läuft bereits' }, { status: 429 })
  }

  // Status auf "processing" setzen
  await supabase.from('sessions').update({ ai_processing_status: 'processing' }).eq('id', id)

  try {
    const admin = createAdminClient()

    // Audio aus Storage laden
    const { data: audioData, error: downloadError } = await admin.storage
      .from(BUCKET)
      .download(session.audio_storage_key)

    if (downloadError || !audioData) {
      throw new Error('Audio-Datei konnte nicht geladen werden')
    }

    const audioBuffer = await audioData.arrayBuffer()
    const filename = session.audio_storage_key.split('/').pop() ?? 'audio.webm'

    // Whisper-Transkription
    const { text: transcript, durationSeconds } = await transcribeAudio(audioBuffer, filename)

    // Ergebnis in ai_session_results speichern (upsert)
    const { error: upsertError } = await admin.from('ai_session_results').upsert(
      {
        tenant_id: session.tenant_id,
        session_id: id,
        transcript,
        processing_seconds: durationSeconds ?? null,
        model_used: 'whisper',
      },
      { onConflict: 'session_id' }
    )

    if (upsertError) {
      console.error('ai_session_results upsert error:', upsertError)
      throw new Error('Transkript konnte nicht gespeichert werden')
    }

    // Status wieder auf "pending" (GPT-4o steht noch aus)
    await supabase.from('sessions').update({ ai_processing_status: 'pending' }).eq('id', id)

    return NextResponse.json({ transcript, processingSeconds: durationSeconds })
  } catch (err) {
    console.error('Transcription error:', err)
    await supabase.from('sessions').update({ ai_processing_status: 'failed' }).eq('id', id)
    return NextResponse.json({ error: 'Transkription fehlgeschlagen' }, { status: 500 })
  }
}
