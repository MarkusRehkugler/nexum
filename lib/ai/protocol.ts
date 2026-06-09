import { getAzureClient, DEPLOYMENT_GPT4O } from './azure-openai'
import { anonymizeText } from './anonymize'

export interface SessionProtocol {
  summary: string              // 3–5 Sätze Sitzungszusammenfassung
  keyThemes: string[]          // Hauptthemen der Sitzung
  extractedTasks: SessionTask[] // Aufgaben für Klient
  suggestedFollowup: string    // Vorschlag für nächste Schritte
  followupMailDraft: string    // Entwurf Follow-up-Mail an Klient
  modelUsed: string
  processingSeconds: number
}

export interface SessionTask {
  description: string
  dueHint?: string   // z. B. "bis nächste Woche"
  priority: 'high' | 'medium' | 'low'
}

const SYSTEM_PROMPT = `Du bist ein professioneller Coaching-Assistent. Du analysierst Transkripte von Coaching-Sitzungen und erstellst strukturierte Protokolle auf Deutsch.

Wichtig:
- Verwende ausschließlich Informationen aus dem Transkript
- Schreibe sachlich und professionell
- Platzhalter wie [KLIENT] im Transkript stehen für den echten Namen und sollen in deiner Ausgabe ebenfalls als [KLIENT] erscheinen
- Extrahiere nur Aufgaben, die explizit im Gespräch vereinbart oder erwähnt wurden
- Antworte ausschließlich mit gültigem JSON (kein Markdown, keine Erklärungen)`

const USER_PROMPT = (transcript: string) => `Analysiere dieses Coaching-Sitzungs-Transkript und erstelle ein strukturiertes Protokoll.

TRANSKRIPT:
${transcript}

Antworte mit folgendem JSON-Format:
{
  "summary": "3-5 Sätze Zusammenfassung der Sitzung",
  "keyThemes": ["Thema 1", "Thema 2"],
  "extractedTasks": [
    {
      "description": "Aufgabenbeschreibung",
      "dueHint": "bis nächste Woche",
      "priority": "high"
    }
  ],
  "suggestedFollowup": "Vorschlag für nächste Schritte in 2-3 Sätzen",
  "followupMailDraft": "Vollständiger Entwurf einer kurzen Follow-up-Mail an [KLIENT] (informell, auf Deutsch)"
}`

export async function generateSessionProtocol(
  transcript: string,
  clientName?: string,
  coachName?: string
): Promise<SessionProtocol> {
  const client = getAzureClient()

  // Anonymisierung vor LLM-Aufruf
  const { text: anonTranscript } = anonymizeText(transcript, { clientName, coachName })

  const start = Date.now()

  const response = await client.chat.completions.create({
    model: DEPLOYMENT_GPT4O,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: USER_PROMPT(anonTranscript) },
    ],
    temperature: 0.3,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  })

  const processingSeconds = Math.round((Date.now() - start) / 1000)
  const raw = response.choices[0]?.message?.content ?? '{}'

  let parsed: Partial<SessionProtocol>
  try {
    parsed = JSON.parse(raw)
  } catch {
    parsed = { summary: raw }
  }

  return {
    summary: parsed.summary ?? '',
    keyThemes: parsed.keyThemes ?? [],
    extractedTasks: (parsed.extractedTasks ?? []).map((t) => ({
      description: t.description ?? '',
      dueHint: t.dueHint,
      priority: t.priority ?? 'medium',
    })),
    suggestedFollowup: parsed.suggestedFollowup ?? '',
    followupMailDraft: parsed.followupMailDraft ?? '',
    modelUsed: DEPLOYMENT_GPT4O,
    processingSeconds,
  }
}
