import Link from 'next/link'
import { LoginForm } from './login-form'

interface Props {
  searchParams: Promise<{ registered?: string; redirectTo?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-zinc-200 bg-white px-8 py-10 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Anmelden</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Willkommen zurück.
        </p>

        {params.registered && (
          <div className="mt-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
            Registrierung erfolgreich! Bitte bestätige deine E-Mail-Adresse.
          </div>
        )}

        <LoginForm redirectTo={params.redirectTo} />

        <p className="mt-6 text-center text-sm text-zinc-500">
          Noch kein Account?{' '}
          <Link
            href="/register"
            className="font-medium text-zinc-900 hover:underline"
          >
            Kostenlos testen
          </Link>
        </p>
      </div>
    </div>
  )
}
