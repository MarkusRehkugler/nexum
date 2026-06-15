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

  // Allowlist doubles as content-type → extension map
  // video/webm included because Chrome MediaRecorder reports it for audio-only recordings
  const ALLOWED_AUDIO_TYPES: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/mp4':  'mp4',
    'audio/mpeg': 'mp3',
    'audio/wav':  'wav',
    'audio/ogg':  'ogg',
    'video/webm': 'webm',
  }

  const rawContentType = req.headers.get('content-type') ?? ''
  const contentType = rawContentType.split(';')[0].trim().toLowerCase()
  const ext = ALLOWED_AUDIO_TYPES[contentType]

  if (!ext) {
    return NextResponse.json({ error: 'Ungültiger Dateityp. Erlaubt: webm, mp4, mp3, wav, ogg.' }, { status: 415 })
  }

  const MAX_BYTES = 500 * 1024 * 1024 // 500 MB
  const contentLength = req.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > MAX_BYTES) {
    return NextResponse.json({ error: 'Datei zu groß (max. 500 MB)' }, { status: 413 })
  }

  const arrayBuffer = await req.arrayBuffer()
  if (arrayBuffer.byteLength === 0) {
    return NextResponse.json({ error: 'Leere Datei' }, { status: 400 })
  }
  if (arrayBuffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: 'Datei zu groß (max. 500 MB)' }, { status: 413 })
  }

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
