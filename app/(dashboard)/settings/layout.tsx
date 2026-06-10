import { SettingsNav } from './settings-nav'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Einstellungen</h1>
        <p className="mt-1 text-sm text-zinc-500">Stammdaten, Leistungen und Rechnungskonfiguration</p>
      </div>
      <SettingsNav />
      {children}
    </div>
  )
}
