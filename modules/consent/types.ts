/**
 * Struktur des consent_records JSONB-Feldes in der clients-Tabelle.
 *
 * Der Coach dokumentiert hier die Einwilligungen, die er vom Klienten
 * erhalten hat (verbal, schriftlich oder digital).
 * Rechtsgrundlage: DSGVO Art. 6 Abs. 1 lit. a + Art. 9 Abs. 2 lit. a.
 *
 * Keine digitale Signatur in MVP — kommt mit M17 (Phase 2).
 */
export interface ConsentRecord {
  /** DSGVO Art. 6: Allgemeine Verarbeitung personenbezogener Daten */
  data_processing: boolean
  /** KI-Verarbeitung von Sitzungsinhalten (Transkription, Protokoll) */
  ai_processing: boolean
  /** Audio-Aufnahmen während der Sitzung */
  session_recording: boolean
  /** Zeitstempel der letzten Aktualisierung */
  signed_at: string | null
  /** Version des Einwilligungstextes */
  version: string
  /** Wie wurde die Einwilligung erteilt */
  method: 'verbal' | 'written' | 'digital' | null
  /** Freitext-Notiz des Coaches (z. B. "Einwilligungsformular ausgefüllt, abgelegt in Akte") */
  notes: string | null
}

export const DEFAULT_CONSENT: ConsentRecord = {
  data_processing:   false,
  ai_processing:     false,
  session_recording: false,
  signed_at:         null,
  version:           '1.0',
  method:            null,
  notes:             null,
}

export const METHOD_LABELS: Record<string, string> = {
  verbal:  'Mündlich',
  written: 'Schriftlich (Papier)',
  digital: 'Digital (E-Mail/Portal)',
}
