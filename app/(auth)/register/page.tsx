import Link from 'next/link'
import { RegisterForm } from './register-form'

export default function RegisterPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-zinc-200 bg-white px-8 py-10 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">14 Tage kostenlos testen</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Kein Free-Tier. Echter Zugang. Keine Kreditkarte jetzt nötig.
        </p>

        <RegisterForm />

        <p className="mt-6 text-center text-sm text-zinc-500">
          Bereits registriert?{' '}
          <Link
            href="/login"
            className="font-medium text-zinc-900 hover:underline"
          >
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  )
}
