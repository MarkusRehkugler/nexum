@AGENTS.md

# CLAUDE.md — Nexum Dev

Dieses Dokument gilt für das Entwicklungs-Repo in `870 Dev & Apps/nexum`.
Das vollständige Produktbriefing (Architektur, Datenmodell, Roadmap) liegt unter:
`400 laufende Projekte/Nexum/CLAUDE.md` → immer zuerst lesen!

---

## Stack

| Layer | Technologie |
|---|---|
| Framework | Next.js 16, TypeScript, App Router |
| Datenbank | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (JWT 15 min + Refresh Cookie) |
| Styling | Tailwind CSS v4, Radix UI, CVA |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |
| Dates | date-fns v4 (immer UTC intern, Anzeige je User-Timezone) |
| KI | Azure OpenAI EU-Region (GPT-4o + Whisper) |
| Queues | Redis + BullMQ (KI-Worker async) |
| Storage | S3 / Supabase Storage |
| i18n | next-intl (Strings immer in /public/locales/de und /en) |

## Projektstruktur

```
app/               Next.js App Router
  (auth)/          Login, Register, Reset-Password
  (dashboard)/     Alle geschützten Seiten (Middleware-Guard)
  api/             Route Handler
lib/
  supabase/        client.ts · server.ts (Supabase-Clients)
  ai/              Azure OpenAI Wrapper, Anonymisierung vor LLM
  utils/           cn(), formatCurrency(), formatDateTime()
modules/           Domain-Module (auth, tenants, clients, sessions, ai, invoices ...)
  [modul]/
    actions.ts     Server Actions
    queries.ts     Datenbank-Abfragen
    types.ts       Modul-spezifische Typen
components/
  ui/              Basis-Komponenten (Button, Input, Dialog ...)
  shared/          Wiederverwendbare App-Komponenten
  layout/          Nav, Sidebar, Header
types/
  database.ts      Generierte Supabase-Typen (nach Schemaänderung neu generieren)
supabase/
  migrations/      001_schema.sql · 002_rls.sql
```

## Kritische Regeln (aus Haupt-CLAUDE.md)

1. **Kein FLOAT für Geld** — `NUMERIC(15,2)` oder `amount_cents INTEGER`
2. **Kein DELETE** — immer `deleted_at` Soft-Delete
3. **`tenant_id` überall** — RLS erzwingt es
4. **Audit-Log append-only** — kein UPDATE/DELETE
5. **Anonymisierung vor LLM** — `lib/ai/anonymize.ts` verwenden
6. **Einwilligung prüfen** — `consent_records` enthält `ai_processing: true` bevor KI-Aufruf
7. **KI-Ergebnisse = Vorschläge** — granulare Einzelfreigabe, kein Bulk-Accept
8. **i18n** — keine Strings inline, alles in `public/locales/`
9. **UTC intern** — `new Date()` speichern, Anzeige via `formatDateTime(date, user.timezone)`
10. **M44-Datenstruktur befüllen** — `session_method_tags` und `outcome_goals` ab erster Sitzung

## Modul-Status (Phase 1 MVP)

| # | Modul | Status |
|---|---|---|
| M01 | Mandantenverwaltung | ✅ fertig |
| M02 | Rollen & Rechte | ✅ fertig |
| M03 | Authentifizierung | ✅ fertig |
| M04 | Consent & DSGVO | ✅ fertig |
| M05 | Klientenakte | ✅ fertig |
| M06 | Begleitplan (Light) | — |
| M07 | Formulare & Assessments | — |
| M08 | Sitzungsdokumentation | ✅ fertig |
| M11 | KI-Protokollierung | ✅ fertig + getestet |
| M14 | E-Mail-Kommunikation | ✅ fertig (mailto:) |
| M15 | Dokumentenverwaltung | ✅ fertig |
| M18 | Kalender & Termine | ✅ fertig |
| M28 | Mobile / PWA | ✅ fertig |
| M38 | KPI-Dashboard | ✅ fertig |
| M20 | Rechnungsmodul (basic) | ✅ fertig |
| M41 | SaaS-Admin | ✅ fertig |

## Nächste Schritte

1. ~~Supabase-Projekt anlegen → Migrations einspielen → `.env.local` befüllen~~ ✅
2. ~~M03 Auth-Flow (Login/Register/Reset-Password Pages + Server Actions)~~ ✅
3. ~~M01/M02 Onboarding (Tenant anlegen bei erster Registrierung)~~ ✅
4. ~~M05 Klientenliste + Klient anlegen~~ ✅
5. ~~M08 Sitzung anlegen + Aufnahme starten~~ ✅
6. ~~M11 KI-Worker (Audio → Transkript → Protokoll)~~ ✅
7. ~~M20 Rechnungsmodul (PDF-Rechnung)~~ ✅
8. ~~M18 Kalender & Terminbuchung~~ ✅
9. ~~M09 Aufgaben-Modul~~ ✅
10. ~~7 Feature-Verbesserungen (Migration 008)~~ ✅
11. **Nächste Optionen:** M04 Consent | Vercel-Deployment

## Feature-Stand nach Migration 008

| Feature | Beschreibung |
|---|---|
| Erweiterte Klientenfelder | Anrede, Vor/Nachname, Geb.-Datum, Mobil, Festnetz, Notfallkontakt |
| Dokument-Kommentare | `documents.notes TEXT` — beim Hochladen + Anzeige |
| Sitzungsfilter | Typ, Klient, Monat via URL-Params `/sessions?type=&clientId=&month=` |
| Manuelle Aufgaben | `createManualTaskAction` — ohne Klient-Verknüpfung möglich |
| Dokumentenbibliothek | `/documents` zeigt nur tenant-eigene Vorlagen (owner_type=tenant) |
| Klienten-Bezeichnung | `tenant_profiles.client_label` — konfigurierbar in Stammdaten |
| Klienten-Verlauf | Journal-Section in Klientenakte (Termine + Sitzungen + Rechnungen) |
