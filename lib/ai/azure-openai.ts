import { AzureOpenAI } from 'openai'

export function getAzureClient() {
  const apiKey     = process.env.AZURE_OPENAI_API_KEY
  const endpoint   = process.env.AZURE_OPENAI_ENDPOINT
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? '2025-01-01-preview'
  if (!apiKey || !endpoint) throw new Error('Azure OpenAI nicht konfiguriert (AZURE_OPENAI_API_KEY + AZURE_OPENAI_ENDPOINT fehlen).')
  return new AzureOpenAI({ apiKey, endpoint, apiVersion })
}

export const DEPLOYMENT_GPT4O   = process.env.AZURE_DEPLOYMENT_GPT4O   ?? 'gpt-4o'
export const DEPLOYMENT_WHISPER = process.env.AZURE_DEPLOYMENT_WHISPER ?? 'whisper-1'
