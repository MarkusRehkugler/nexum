import Link from 'next/link'
import { ResetPasswordForm } from './reset-password-form'

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-zinc-200 bg-white px-8 py-10 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Passwort zurücksetzen</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Wir schicken dir einen Link zum Zurücksetzen.
        </p>

        <ResetPasswordForm />

        <p className="mt-6 text-center text-sm text-zinc-500">
          <Link href="/login" className="font-medium text-zinc-900 hover:underline">
            ← Zurück zur Anmeldung
          </Link>
        </p>
      </div>
    </div>
  )
}
