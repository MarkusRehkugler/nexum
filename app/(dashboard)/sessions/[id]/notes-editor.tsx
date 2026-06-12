'use client'

import { useState, useTransition } from 'react'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
import { updateSessionNotesAction } from '@/modules/sessions/actions'

interface Props {
  sessionId: string
  initialNotes: string | null
}

export function NotesEditor({ sessionId, initialNotes }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialNotes ?? '')
  const [saved, setSaved] = useState(initialNotes ?? '')
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      await updateSessionNotesAction(sessionId, value)
      setSaved(value)
      setEditing(false)
    })
  }

  function handleCancel() {
    setValue(saved)
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="group relative rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Notizen</h2>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 transition-colors"
          >
            <Pencil className="h-3 w-3" />
            Bearbeiten
          </button>
        </div>
        {saved ? (
          <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">{saved}</p>
        ) : (
          <p className="text-sm text-zinc-400 italic">Keine Notizen — klicke auf „Bearbeiten" um welche hinzuzufügen.</p>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-400 bg-white p-5 shadow-sm ring-2 ring-zinc-200">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Notizen</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <X className="h-3 w-3" />
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-1 rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            Speichern
          </button>
        </div>
      </div>
      <textarea
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={6}
        className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 leading-relaxed focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-300"
        placeholder="Handschriftliche Notizen, Beobachtungen, Stichwörter …"
      />
    </div>
  )
}
