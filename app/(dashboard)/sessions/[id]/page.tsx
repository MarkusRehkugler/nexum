import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Receipt, Clock, User } from 'lucide-react'
import { getSessionById } from '@/modules/sessions/queries'
import { SESSION_TYPE_LABELS } from '@/modules/sessions/schemas'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { getTaskCountForSession } from '@/modules/tasks/queries'
import type { ConsentRecord } from '@/modules/consent/types'
import { AudioRecorder } from './audio-recorder'
import { AiPanel } from './ai-panel'

interface Props {
  params: Promise<{ id: string }>
}

function statusLabel(s: string) {
  return s === 'draft' ? 'Entwurf' : s === 'completed' ? 'Abgeschlossen' : 'Abgerechnet'
}
function statusClass(s: string) {
  return s === 'draft'
    ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
    : s === 'completed'
    ? 'bg-green-50 text-green-700 ring-green-600/20'
    : 'bg-blue-50 text-blue-700 ring-blue-600/20'
}

export default async function SessionDetailPage({ params }: Props) {
  const { id } = await params
  const session = await getSessionById(id)

  if (!session) notFound()

  const clientName =
    session.case?.client?.personal_data?.name ??
    session.case?.client?.display_label ?? '—'

  const sessionDate = new Date(session.session_date).toLocaleDateString('de-DE', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
  const sessionTime = new Date(session.session_date).toLocaleTimeString('de-DE', {
    hour: '2-digit', minute: '2-digit',
  })

  const clientId = session.case?.client_id ?? ''

  // KI-Ergebnis laden (falls vorhanden)
  const admin = createAdminClient()
  const { data: aiResult } = await admin
    .from('ai_session_results')
    .select('transcript, summary, extracted_tasks, suggested_followup, followup_mail_draft, reviewed_by_user_at')
    .eq('session_id', id)
    .maybeSingle()

  const initialAiResult = aiResult
    ? {
        transcript: aiResult.transcript,
        summary: aiResult.summary,
        extractedTasks: aiResult.extracted_tasks as Array<{ description: string; dueHint?: string; priority: string }> | null,
        suggestedFollowup: aiResult.suggested_followup,
        followupMailDraft: aiResult.followup_mail_draft,
        reviewedByUserAt: aiResult.reviewed_by_user_at,
      }
    : null

  const savedTaskCount = await getTaskCountForSession(id)

  // KI-Einwilligung des Klienten prüfen
  let aiConsentGiven = false
  if (clientId) {
    const supabase = await createClient()
    const { data: clientData } = await supabase
      .from('clients')
      .select('consent_records')
      .eq('id', clientId)
      .maybeSingle()
    const consent = clientData?.consent_records as ConsentRecord | null
    aiConsentGiven = consent?.ai_processing === true
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link href="/sessions" className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
        <ChevronLeft className="h-4 w-4" />
        Sitzungen
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            {SESSION_TYPE_LABELS[session.type] ?? session.type}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              <Link href={`/clients/${session.case?.client_id}`} className="hover:underline">
                {clientName}
              </Link>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {sessionDate}, {sessionTime}
              {session.duration_minutes && ` · ${session.duration_minutes} min`}
            </span>
          </p>
        </div>
        <span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusClass(session.status)}`}>
          {statusLabel(session.status)}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Linke Spalte: Audio + Handnotizen */}
        <div className="space-y-4">
          {/* Audio-Aufnahme */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-zinc-700">🎙️ Aufnahme</h2>
            <AudioRecorder
              sessionId={id}
              hasExistingAudio={!!session.audio_storage_key}
            />
          </div>

          {/* Handnotizen */}
          {session.notes_raw && (
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">Handnotizen</h2>
              <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">{session.notes_raw}</p>
            </div>
          )}
        </div>

        {/* Rechte Spalte: KI-Pipeline */}
        <div>
          <h2 className="mb-4 text-sm font-semibold text-zinc-700">🤖 KI-Dokumentation</h2>
          <AiPanel
            sessionId={id}
            clientId={clientId}
            aiProcessingStatus={session.ai_processing_status}
            hasAudio={!!session.audio_storage_key}
            initialResult={initialAiResult}
            savedTaskCount={savedTaskCount}
            aiConsentGiven={aiConsentGiven}
          />
        </div>
      </div>

      {/* Aktionen */}
      <div className="flex items-center gap-3 border-t border-zinc-100 pt-4">
        <Link
          href={`/invoices/new?sessionId=${id}`}
          className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-300 hover:shadow-sm transition-all"
        >
          <Receipt className="h-4 w-4" />
          Rechnung erstellen
        </Link>
      </div>
    </div>
  )
}
