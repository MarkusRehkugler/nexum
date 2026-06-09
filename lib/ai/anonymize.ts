/**
 * Einfache Anonymisierung für MVP.
 * Ersetzt Klientennamen und andere PII durch Platzhalter, bevor Text
 * an Azure OpenAI gesendet wird.
 *
 * TODO Phase 3: NER-basierte Anonymisierung (spaCy / Azure AI Language).
 */

export interface AnonymizationMap {
  [original: string]: string
}

export interface AnonymizedResult {
  text: string
  map: AnonymizationMap   // Rückübersetzung falls nötig
}

/**
 * Ersetzt bekannte Namen durch generische Platzhalter.
 * clientName wird zu "[KLIENT]", ggf. weitere Wörter übergeben.
 */
export function anonymizeText(
  text: string,
  options: { clientName?: string; coachName?: string } = {}
): AnonymizedResult {
  const map: AnonymizationMap = {}
  let result = text

  if (options.clientName) {
    const placeholder = '[KLIENT]'
    map[options.clientName] = placeholder
    // Case-insensitive Ersetzung
    result = result.replace(new RegExp(escapeRegex(options.clientName), 'gi'), placeholder)
  }

  if (options.coachName) {
    const placeholder = '[COACH]'
    map[options.coachName] = placeholder
    result = result.replace(new RegExp(escapeRegex(options.coachName), 'gi'), placeholder)
  }

  return { text: result, map }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
