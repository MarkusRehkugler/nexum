import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

const BUCKET = 'session-audio'

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/sessions/[id]/audio  — liefert einen signierten Download-URL
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: session } = await supabase
    .from('sessions')
    .select('audio_storage_key')
    .eq('id', id)
    .single()

  if (!session?.audio_storage_key) {
    return NextResponse.json({ error: 'Keine Aufnahme vorhanden' }, { status: 404 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(session.audio_storage_key, 3600) // 1h gültig

  if (error || !data) {
    return NextResponse.json({ error: 'URL konnte nicht erstellt werden' }, { status: 500 })
  }

  return NextResponse.json({ url: data.signedUrl })
}

// POST /api/sessions/[id]/audio  — lädt Audio-Datei hoch
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Session + Tenant prüfen (RLS sichert ab)
  const { data: session } = await supabase
    .from('sessions')
    .select('tenant_id')
    .eq('id', id)
    .single()

  if (!session) return NextResponse.json({ error: 'Sitzung nicht gefunden' }, { status: 404 })

  const arrayBuffer = await req.arrayBuffer()
  if (arrayBuffer.byteLength === 0) {
    return NextResponse.json({ error: 'Leere Datei' }, { status: 400 })
  }

  const contentType = req.headers.get('content-type') ?? 'audio/webm'
  const ext = contentType.includes('mp4') ? 'mp4'
    : contentType.includes('mpeg') || contentType.includes('mp3') ? 'mp3'
    : contentType.includes('wav') ? 'wav'
    : 'webm'

  const storagePath = `${session.tenant_id}/${id}.${ext}`

  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, Buffer.from(arrayBuffer), {
      contentType,
      upsert: true,   // Überschreiben erlaubt
    })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    return NextResponse.json({ error: 'Upload fehlgeschlagen' }, { status: 500 })
  }

  // audio_storage_key in session updaten
  const { error: updateError } = await supabase
    .from('sessions')
    .update({ audio_storage_key: storagePath })
    .eq('id', id)

  if (updateError) {
    console.error('Session update error:', updateError)
    return NextResponse.json({ error: 'Session konnte nicht aktualisiert werden' }, { status: 500 })
  }

  return NextResponse.json({ storagePath })
}
