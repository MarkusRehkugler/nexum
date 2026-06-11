import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Brain, FileText, CalendarDays, Receipt, Shield, Users,
  ChevronRight, Zap, Lock, Mic,
} from 'lucide-react'

export const metadata = {
  title: 'Nexum — Das Betriebssystem für Coaches & Therapeuten',
  description: 'Klientenverwaltung, KI-Protokollierung, Rechnungen und DSGVO-Compliance in einer App. Für Coaches, Therapeuten und Berater.',
}

const FEATURES = [
  {
    icon: Brain,
    title: 'KI-Protokollierung',
    description: 'Sitzungen automatisch transkribieren und Protokolle mit GPT-4o generieren. Aufgaben und Followups werden direkt extrahiert.',
  },
  {
    icon: Users,
    title: 'Klientenakte',
    description: 'Vollständige Klientenverwaltung mit Kontaktdaten, Verlauf, Dokumenten und Einwilligungen — alles an einem Ort.',
  },
  {
    icon: CalendarDays,
    title: 'Kalender & Termine',
    description: 'Termine planen, Sitzungen dokumentieren und den Überblick über alle Klienten behalten.',
  },
  {
    icon: Receipt,
    title: 'Rechnungsmodul',
    description: 'Rechnungen erstellen, versenden und den Zahlungsstatus verwalten — direkt aus der Klientenakte.',
  },
  {
    icon: Shield,
    title: 'DSGVO-konform',
    description: 'Einwilligungsmanagement, Soft-Delete und KI-Consent pro Klient. Gebaut für die Anforderungen von Gesundheitsberufen.',
  },
  {
    icon: FileText,
    title: 'Dokumentenbibliothek',
    description: 'Formulare, Vorlagen und klientenbezogene Dokumente sicher verwalten und mit Kommentaren versehen.',
  },
]

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-zinc-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900">
              <span className="text-sm font-bold text-white">N</span>
            </div>
            <span className="text-sm font-semibold text-zinc-900">Nexum</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Anmelden
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
            >
              Kostenlos starten
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600 mb-8">
          <Zap className="h-3.5 w-3.5 text-zinc-500" />
          KI-gestützte Sitzungsdokumentation
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
          Das Betriebssystem für<br />
          <span className="text-zinc-500">Menschen, die Menschen begleiten.</span>
        </h1>
        <p className="mt-6 text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed">
          Nexum vereint Klientenverwaltung, KI-Protokollierung, Rechnungen und DSGVO-Compliance
          in einer durchgängigen Webapp — für Coaches, Therapeuten und Berater.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors shadow-sm"
          >
            Jetzt kostenlos testen
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            Bereits registriert? Anmelden →
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-zinc-100 bg-zinc-50 p-6 hover:border-zinc-200 transition-colors"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-zinc-200 shadow-sm">
                <Icon className="h-5 w-5 text-zinc-700" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
              <p className="mt-2 text-sm text-zinc-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* KI-Highlight */}
      <section className="bg-zinc-900 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 mb-6">
                <Mic className="h-3.5 w-3.5" />
                Azure Whisper + GPT-4o
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white">
                KI-Protokolle in Minuten,<br />nicht Stunden.
              </h2>
              <p className="mt-4 text-zinc-400 leading-relaxed">
                Sitzung aufnehmen, transkribieren und mit GPT-4o ein strukturiertes Protokoll erstellen lassen.
                Aufgaben, Followups und Zusammenfassungen werden automatisch extrahiert — zur Freigabe, nicht zur blinden Übernahme.
              </p>
              <div className="mt-8 flex flex-col gap-3">
                {[
                  'Transkription mit Azure Whisper (EU-Region)',
                  'Anonymisierung vor LLM-Verarbeitung',
                  'KI-Consent pro Klient dokumentierbar',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                    <div className="h-1.5 w-1.5 rounded-full bg-zinc-500 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-6 space-y-3">
              {[
                { label: 'Transkription', status: 'Fertig', color: 'text-green-400' },
                { label: 'Anonymisierung', status: 'Fertig', color: 'text-green-400' },
                { label: 'Zusammenfassung', status: 'Generiert', color: 'text-blue-400' },
                { label: '3 Aufgaben erkannt', status: 'Zur Freigabe', color: 'text-amber-400' },
                { label: 'Follow-up-Mail', status: 'Entwurf bereit', color: 'text-zinc-400' },
              ].map(({ label, status, color }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-300">{label}</span>
                  <span className={`font-medium ${color}`}>{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* DSGVO */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-8 sm:p-12 text-center">
          <Lock className="h-8 w-8 text-zinc-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
            Gebaut für Gesundheitsberufe.
          </h2>
          <p className="mt-3 text-zinc-500 max-w-xl mx-auto leading-relaxed">
            KI-Einwilligung pro Klient, Soft-Delete statt Hard-Delete, Mandantentrennung via Row-Level-Security.
            KI-Verarbeitung findet ausschließlich auf Azure EU-Servern statt.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
          >
            Jetzt starten <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-8">
        <div className="mx-auto max-w-5xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-zinc-900">
              <span className="text-[10px] font-bold text-white">N</span>
            </div>
            Nexum · Das Betriebssystem für Menschen, die Menschen begleiten.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-zinc-700 transition-colors">Anmelden</Link>
            <Link href="/register" className="hover:text-zinc-700 transition-colors">Registrieren</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
