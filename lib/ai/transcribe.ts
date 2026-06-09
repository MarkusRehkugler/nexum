import { getAzureClient, DEPLOYMENT_WHISPER } from './azure-openai'
import { toFile } from 'openai'

export interface TranscriptionResult {
  text: string
  durationSeconds?: number
}

/**
 * Transkribiert eine Audio-Datei via Azure OpenAI Whisper.
 * @param audioBuffer  Raw audio bytes (webm/mp3/wav)
 * @param filename     Dateiname inkl. Extension (z. B. "session.webm")
 * @param language     ISO-639-1-Sprachcode, Standard "de"
 */
export async function transcribeAudio(
  audioBuffer: ArrayBuffer,
  filename = 'audio.webm',
  language = 'de'
): Promise<TranscriptionResult> {
  const client = getAzureClient()

  const file = await toFile(Buffer.from(audioBuffer), filename, {
    type: getMimeType(filename),
  })

  const start = Date.now()

  const transcription = await client.audio.transcriptions.create({
    model: DEPLOYMENT_WHISPER,
    file,
    language,
    response_format: 'json',
  })

  const durationSeconds = Math.round((Date.now() - start) / 1000)

  return {
    text: transcription.text,
    durationSeconds,
  }
}

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    webm: 'audio/webm',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
    mp4: 'audio/mp4',
    ogg: 'audio/ogg',
  }
  return map[ext ?? ''] ?? 'audio/webm'
}
