import OpenAI from 'openai'

export function getAzureClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY ist nicht gesetzt.')
  return new OpenAI({ apiKey })
}

export const DEPLOYMENT_GPT4O = process.env.OPENAI_MODEL_GPT4O ?? 'gpt-4o'
export const DEPLOYMENT_WHISPER = process.env.OPENAI_MODEL_WHISPER ?? 'whisper-1'
