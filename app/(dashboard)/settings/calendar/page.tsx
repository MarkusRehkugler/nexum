import { CheckCircle2, Calendar, AlertCircle } from 'lucide-react'
import { getGoogleCalendarConnection, disconnectGoogleCalendarAction } from '@/modules/google-calendar/actions'

export default async function CalendarSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string; reason?: string }>
}) {
  const params = await searchParams
  const connection = await getGoogleCalendarConnection()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-base font-semibold text-zinc-900">Kalender-Integration</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Verbinde deinen Google-Kalender, damit Nexum-Termine automatisch dort erscheinen
          und deine privaten Termine bei der Online-Buchung geblockt werden.
        </p>
      </div>

      {params.connected === '1' && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Google Kalender erfolgreich verbunden.
        </div>
      )}

      {params.error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Fehler beim Verbinden: {errorMessage(params.error)}{params.reason ? ` (${params.reason})` : ''}
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 divide-y divide-zinc-100">
        <div className="flex items-center gap-4 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100">
            <Calendar className="h-5 w-5 text-zinc-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-900">Google Kalender</p>
            {connection ? (
              <p className="text-sm text-zinc-500">
                Verbunden als <span className="font-medium text-zinc-700">{connection.connected_email}</span>
              </p>
            ) : (
              <p className="text-sm text-zinc-500">Nicht verbunden</p>
            )}
          </div>
          {connection ? (
            <form action={disconnectGoogleCalendarAction}>
              <button
                type="submit"
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Trennen
              </button>
            </form>
          ) : (
            <a
              href="/api/google-calendar/connect"
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
            >
              Verbinden
            </a>
          )}
        </div>

        {connection && (
          <div className="px-5 py-4 text-sm text-zinc-500 space-y-1">
            <p>
              <span className="font-medium text-zinc-700">Kalender:</span>{' '}
              {connection.calendar_id === 'primary' ? 'Hauptkalender' : connection.calendar_id}
            </p>
            <p>
              <span className="font-medium text-zinc-700">Verbunden seit:</span>{' '}
              {new Date(connection.connected_at).toLocaleDateString('de-DE', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
        )}
      </div>

      <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-4 text-sm text-zinc-600 space-y-2">
        <p className="font-medium text-zinc-700">Was wird synchronisiert?</p>
        <ul className="space-y-1 text-zinc-500">
          <li>✓ Neue Termine in Nexum erscheinen automatisch in Google Kalender</li>
          <li>✓ Gelöschte Termine werden auch in Google Kalender entfernt</li>
          <li>✓ Deine privaten Google-Termine blockieren Zeitslots bei der Online-Buchung</li>
          <li className="text-zinc-400">— Private Termindetails sind in Nexum nicht sichtbar (nur „belegt")</li>
        </ul>
      </div>
    </div>
  )
}

function errorMessage(code: string): string {
  const messages: Record<string, string> = {
    access_denied: 'Zugriff verweigert.',
    invalid_state: 'Ungültige Sitzung – bitte erneut versuchen.',
    token_exchange: 'Token-Austausch fehlgeschlagen.',
    no_tenant: 'Kein Konto gefunden.',
  }
  return messages[code] ?? code
}
