'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, ShieldAlert, ChevronDown, ChevronUp, Loader2, Check } from 'lucide-react'
import { updateConsentAction } from '@/modules/consent/actions'
import type { ConsentRecord } from '@/modules/consent/types'
import { METHOD_LABELS } from '@/modules/consent/types'

interface Props {
  clientId: string
  consent: ConsentRecord
}

function ConsentBadge({ granted, label }: { granted: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
      granted
        ? 'border-green-200 bg-green-50 text-green-800'
        : 'border-zinc-200 bg-zinc-50 text-zinc-500'
    }`}>
      {granted
        ? <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
        : <ShieldAlert className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
      }
      <span className="font-medium">{label}</span>
    </div>
  )
}

export function ConsentPanel({ clientId, consent }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Formular-State
  const [dataProcessing, setDataProcessing] = useState(consent.data_processing)
  const [aiProcessing, setAiProcessing] = useState(consent.ai_processing)
  const [sessionRecording, setSessionRecording] = useState(consent.session_recording)
  const [method, setMethod] = useState<string>(consent.method ?? '')
  const [notes, setNotes] = useState(consent.notes ?? '')

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    const result = await updateConsentAction(clientId, {
      data_processing:   dataProcessing,
      ai_processing:     aiProcessing,
      session_recording: sessionRecording,
      method:            (method || null) as ConsentRecord['method'],
      notes:             notes || null,
    })

    if (result.error) {
      alert(result.error)
      setSaving(false)
      return
    }

    setSaved(true)
    setSaving(false)
    router.refresh()
    // Formular 1,5 Sek. offen lassen, dann schließen
    setTimeout(() => {
      setSaved(false)
      setOpen(false)
    }, 1500)
  }

  const signedAt = consent.signed_at
    ? new Date(consent.signed_at).toLocaleDateString('de-DE', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-700">Einwilligungen (DSGVO)</h2>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
        >
          {open ? 'Schließen' : 'Bearbeiten'}
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Status-Badges */}
      <div className="grid grid-cols-3 gap-2 px-5 pb-4">
        <ConsentBadge granted={consent.data_processing}   label="Datenverarbeitung" />
        <ConsentBadge granted={consent.ai_processing}     label="KI-Verarbeitung" />
        <ConsentBadge granted={consent.session_recording} label="Aufnahmen" />
      </div>

      <p className="px-5 pb-4 text-xs text-zinc-400">
        {signedAt
          ? <>Vom Therapeuten dokumentiert · {signedAt}{consent.method && ` · ${METHOD_LABELS[consent.method] ?? consent.method}`}</>
          : 'Noch nicht dokumentiert — bitte Einwilligungen erfassen'}
      </p>

      {/* Formular */}
      {open && (
        <div className="border-t border-zinc-100 p-5 space-y-5">
          {/* Rechtlicher Hinweis */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 leading-relaxed">
            <strong>Hinweis:</strong> Hier dokumentierst du als Coach, welche Einwilligungen du von deinem Klienten erhalten hast (z. B. mündlich zu Beginn der Zusammenarbeit oder durch Unterzeichnung eines Formulars). Die tatsächliche Einwilligung liegt außerhalb dieser Software.
          </div>

          {/* Checkboxen */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-2">
              Erteilte Einwilligungen
            </legend>

            {[
              {
                id: 'data_processing',
                label: 'Datenverarbeitung (DSGVO Art. 6)',
                desc: 'Allgemeine Verarbeitung personenbezogener Daten im Rahmen der Begleitung.',
                checked: dataProcessing,
                onChange: setDataProcessing,
              },
              {
                id: 'ai_processing',
                label: 'KI-Verarbeitung von Sitzungsinhalten',
                desc: 'Transkription und KI-Protokollierung von Sitzungsaufnahmen (Art. 9 DSGVO).',
                checked: aiProcessing,
                onChange: setAiProcessing,
              },
              {
                id: 'session_recording',
                label: 'Audio-Aufnahmen der Sitzungen',
                desc: 'Aufzeichnung von Sitzungen zur nachträglichen Transkription.',
                checked: sessionRecording,
                onChange: setSessionRecording,
              },
            ].map(({ id, label, desc, checked, onChange }) => (
              <label
                key={id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  checked ? 'border-green-200 bg-green-50' : 'border-zinc-200 bg-white hover:border-zinc-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => onChange(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-green-600 focus:ring-green-500"
                />
                <div>
                  <p className="text-sm font-medium text-zinc-900">{label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
                </div>
              </label>
            ))}
          </fieldset>

          {/* Methode */}
          <div>
            <label htmlFor="method" className="block text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-2">
              Einwilligungsmethode
            </label>
            <select
              id="method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200"
            >
              <option value="">— nicht angegeben —</option>
              {Object.entries(METHOD_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Notiz */}
          <div>
            <label htmlFor="consent_notes" className="block text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-2">
              Interne Notiz
              <span className="ml-1.5 normal-case font-normal text-zinc-400">(optional, z. B. Ablageort des Formulars)</span>
            </label>
            <textarea
              id="consent_notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="z. B. Einwilligungsformular v1.0, ausgefüllt am 09.06.2026, in Papierakte abgelegt."
              className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 resize-none"
            />
          </div>

          {/* Speichern */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {saving
              ? <><Loader2 className="h-4 w-4 animate-spin" />Wird gespeichert…</>
              : saved
              ? <><Check className="h-4 w-4" />Gespeichert</>
              : 'Einwilligungen speichern'
            }
          </button>
        </div>
      )}
    </div>
  )
}
