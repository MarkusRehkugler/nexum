'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, Square, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

type RecorderState = 'idle' | 'recording' | 'uploading' | 'done' | 'error'

interface Props {
  sessionId: string
  hasExistingAudio: boolean
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function AudioRecorder({ sessionId, hasExistingAudio }: Props) {
  const router = useRouter()
  const [state, setState] = useState<RecorderState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [uploadProgress, setUploadProgress] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startRecording = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Beste unterstützte MIME-Type ermitteln
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.start(1000) // alle 1s ein Chunk
      setState('recording')
      setDuration(0)

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1)
      }, 1000)
    } catch (err) {
      setError('Mikrofon konnte nicht gestartet werden. Bitte Berechtigung erteilen.')
      setState('error')
    }
  }, [])

  const stopAndUpload = useCallback(async () => {
    if (!mediaRecorderRef.current) return

    if (timerRef.current) clearInterval(timerRef.current)

    return new Promise<void>((resolve) => {
      const recorder = mediaRecorderRef.current!

      recorder.onstop = async () => {
        setState('uploading')
        setUploadProgress(0)

        // Stream stoppen
        recorder.stream.getTracks().forEach((t) => t.stop())

        const mimeType = recorder.mimeType || 'audio/webm'
        const audioBlob = new Blob(chunksRef.current, { type: mimeType })

        try {
          setUploadProgress(30)

          const response = await fetch(`/api/sessions/${sessionId}/audio`, {
            method: 'POST',
            body: audioBlob,
            headers: { 'Content-Type': mimeType },
          })

          setUploadProgress(90)

          if (!response.ok) {
            const { error } = await response.json()
            throw new Error(error ?? 'Upload fehlgeschlagen')
          }

          setUploadProgress(100)
          setState('done')
          router.refresh() // Server Component neu laden → hasExistingAudio aktualisiert
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Upload fehlgeschlagen')
          setState('error')
        }
        resolve()
      }

      recorder.stop()
    })
  }, [sessionId, router])

  if (state === 'done' || hasExistingAudio) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-700">
        <CheckCircle className="h-4 w-4" />
        Aufnahme gespeichert
        {!hasExistingAudio && (
          <button
            onClick={() => { setState('idle'); setDuration(0) }}
            className="ml-2 text-xs text-zinc-500 hover:text-zinc-900 underline"
          >
            Neue Aufnahme
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {state === 'idle' && (
        <button
          onClick={startRecording}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-red-500 transition-colors"
        >
          <Mic className="h-4 w-4" />
          Aufnahme starten
        </button>
      )}

      {state === 'recording' && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-mono text-zinc-700">{formatDuration(duration)}</span>
            <span className="text-xs text-zinc-400">Aufnahme läuft …</span>
          </div>
          <button
            onClick={stopAndUpload}
            className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
            Stoppen &amp; Speichern
          </button>
        </div>
      )}

      {state === 'uploading' && (
        <div className="flex items-center gap-3 text-sm text-zinc-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Wird hochgeladen … {uploadProgress}%
        </div>
      )}

      {state === 'error' && (
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
          <button
            onClick={() => { setState('idle'); setError(null) }}
            className="text-xs text-zinc-500 hover:text-zinc-900 underline"
          >
            Nochmal versuchen
          </button>
        </div>
      )}
    </div>
  )
}
