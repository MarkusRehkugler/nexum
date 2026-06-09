'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Brain, Wand2, CheckCircle, Loader2, AlertCircle, ChevronDown, ChevronUp, ListChecks, Mail, Sparkles, Save } from 'lucide-react'
import { saveAiTasksAction } from '@/modules/tasks/actions'

interface AiResult {
  transcript?: string | null
  summary?: string | null
  extractedTasks?: Array<{ description: string; dueHint?: string; priority: string }> | null
  suggestedFollowup?: string | null
  followupMailDraft?: string | null
  reviewedByUserAt?: string | null
}

interface Props {
  sessionId: string
  clientId: string
  aiProcessingStatus: string
  hasAudio: boolean
  initialResult: AiResult | null
  savedTaskCount: number
  aiConsentGiven: boolean
}

type Step = 'transcribe' | 'protocol'
type StepState = 'idle' | 'loading' | 'done' | 'error'

export function AiPanel({ sessionId, clientId, aiProcessingStatus, hasAudio, initialResult, savedTaskCount, aiConsentGiven }: Props) {
  const [transcribeState, setTranscribeState] = useState<StepState>(
    initialResult?.transcript ? 'done' : 'idle'
  )
  const [protocolState, setProtocolState] = useState<StepState>(
    initialResult?.summary ? 'done' : 'idle'
  )
  const [result, setResult] = useState<AiResult>(initialResult ?? {})
  const [error, setError] = useState<string | null>(null)
  const [showTranscript, setShowTranscript] = useState(false)
  const [showMail, setShowMail] = useState(false)
  const [tasksSaving, setTasksSaving] = useState(false)
  const [tasksSavedCount, setTasksSavedCount] = useState(savedTaskCount)

  async function runStep(step: Step) {
    setError(null)
    if (step === 'transcribe') setTranscribeState('loading')
    else setProtocolState('loading')

    try {
      const resp = await fetch(`/api/sessions/${sessionId}/${step}`, { method: 'POST' })
      const data = await resp.json()

      if (!resp.ok) throw new Error(data.error ?? 'Fehler beim Verarbeiten')

      if (step === 'transcribe') {
        setResult((r) => ({ ...r, transcript: data.transcript }))
        setTranscribeState('done')
      } else {
        setResult((r) => ({ ...r, ...data.protocol }))
        setProtocolState('done')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
      if (step === 'transcribe') setTranscribeState('error')
      else setProtocolState('error')
    }
  }

  async function handleSaveTasks() {
    if (!result.extractedTasks?.length || !clientId) return
    setTasksSaving(true)
    const tasks = result.extractedTasks.map((t) => ({
      description: t.description,
      dueHint: t.dueHint,
      priority: (t.priority as 'high' | 'medium' | 'low') ?? 'medium',
    }))
    const res = await saveAiTasksAction(sessionId, clientId, tasks)
    if (res.count !== undefined) {
      setTasksSavedCount(res.count)
    }
    setTasksSaving(false)
  }

  const canTranscribe = hasAudio && aiConsentGiven
  const canGenerateProtocol = (transcribeState === 'done' || !!result.transcript) && aiConsentGiven

  return (
    <div className="space-y-4">
      {/* Consent-Guard */}
      {!aiConsentGiven && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium">KI-Einwilligung fehlt</p>
            <p className="mt-0.5 text-xs text-amber-700">
              Dieser Klient hat die KI-Verarbeitung noch nicht freigegeben.{' '}
              <Link href={`/clients/${clientId}`} className="underline hover:text-amber-900">
                Einwilligung dokumentieren →
              </Link>
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Schritt 1: Transkription */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
              transcribeState === 'done' ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'
            }`}>1</span>
            Transkription (Whisper)
          </h3>
          {transcribeState === 'idle' && (
            <button
              onClick={() => runStep('transcribe')}
              disabled={!canTranscribe}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Transkribieren
            </button>
          )}
          {transcribeState === 'loading' && (
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Wird transkribiert …
            </span>
          )}
          {transcribeState === 'done' && (
            <button
              onClick={() => setShowTranscript((v) => !v)}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900"
            >
              Transkript {showTranscript ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
        </div>

        {!canTranscribe && transcribeState === 'idle' && (
          <p className="mt-2 text-xs text-zinc-400">
            {!aiConsentGiven ? 'KI-Einwilligung erforderlich.' : 'Erst Audio aufnehmen.'}
          </p>
        )}

        {transcribeState === 'done' && showTranscript && result.transcript && (
          <div className="mt-3 max-h-48 overflow-y-auto rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600 leading-relaxed">
            {result.transcript}
          </div>
        )}
      </div>

      {/* Schritt 2: Protokoll */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
              protocolState === 'done' ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'
            }`}>2</span>
            KI-Protokoll (GPT-4o)
          </h3>
          {protocolState === 'idle' && (
            <button
              onClick={() => runStep('protocol')}
              disabled={!canGenerateProtocol}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Brain className="h-3.5 w-3.5" />
              Generieren
            </button>
          )}
          {protocolState === 'loading' && (
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              GPT-4o analysiert …
            </span>
          )}
        </div>

        {!canGenerateProtocol && protocolState === 'idle' && (
          <p className="mt-2 text-xs text-zinc-400">
            {!aiConsentGiven ? 'KI-Einwilligung erforderlich.' : 'Erst Transkription ausführen.'}
          </p>
        )}

        {protocolState === 'done' && result.summary && (
          <div className="mt-4 space-y-4">
            {/* Zusammenfassung */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">Zusammenfassung</p>
              <p className="text-sm text-zinc-700 leading-relaxed">{result.summary}</p>
            </div>

            {/* Aufgaben */}
            {result.extractedTasks && result.extractedTasks.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    <ListChecks className="h-3.5 w-3.5" />
                    Aufgaben ({result.extractedTasks.length})
                  </p>
                  {/* Aufgaben speichern */}
                  {tasksSavedCount > 0 ? (
                    <Link
                      href="/tasks"
                      className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      {tasksSavedCount} gespeichert
                    </Link>
                  ) : (
                    <button
                      onClick={handleSaveTasks}
                      disabled={tasksSaving}
                      className="flex items-center gap-1 rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                    >
                      {tasksSaving
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <Save className="h-3 w-3" />
                      }
                      Speichern
                    </button>
                  )}
                </div>
                <ul className="space-y-1.5">
                  {result.extractedTasks.map((task, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        task.priority === 'high' ? 'bg-red-100 text-red-700'
                        : task.priority === 'low' ? 'bg-zinc-100 text-zinc-500'
                        : 'bg-yellow-100 text-yellow-700'
                      }`}>!</span>
                      <span className="text-sm text-zinc-700">
                        {task.description}
                        {task.dueHint && (
                          <span className="ml-1 text-xs text-zinc-400">({task.dueHint})</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Nächste Schritte */}
            {result.suggestedFollowup && (
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  Nächste Schritte
                </p>
                <p className="text-sm text-zinc-700 leading-relaxed">{result.suggestedFollowup}</p>
              </div>
            )}

            {/* Follow-up Mail */}
            {result.followupMailDraft && (
              <div>
                <button
                  onClick={() => setShowMail((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400 hover:text-zinc-700"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Follow-up-Mail {showMail ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                {showMail && (
                  <div className="mt-2 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">
                    {result.followupMailDraft}
                  </div>
                )}
              </div>
            )}

            <p className="flex items-center gap-1.5 text-xs text-zinc-400">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              KI-Vorschläge — bitte vor Verwendung prüfen.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
