'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoginSchema, RegisterSchema, ResetPasswordSchema } from './schemas'
import { createTenantAndProfile } from '@/modules/tenants/actions'
import { slugify } from '@/lib/utils'

export type ActionState = {
  error?: string
  success?: string
} | null

// ── Login ────────────────────────────────────────────────────────────────────

export async function loginAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Bitte bestätige zuerst deine E-Mail-Adresse.' }
    }
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'E-Mail oder Passwort ist falsch.' }
    }
    return { error: 'Anmeldung fehlgeschlagen. Bitte versuche es erneut.' }
  }

  redirect('/dashboard')
}

// ── Register ─────────────────────────────────────────────────────────────────

export async function registerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = RegisterSchema.safeParse({
    name: formData.get('name'),
    practiceName: formData.get('practiceName'),
    email: formData.get('email'),
    password: formData.get('password'),
    passwordConfirm: formData.get('passwordConfirm'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe' }
  }

  const supabase = await createClient()

  // 1. Supabase Auth User anlegen
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        name: parsed.data.name,
      },
    },
  })

  if (signUpError) {
    if (signUpError.message.includes('already registered')) {
      return { error: 'Diese E-Mail-Adresse ist bereits registriert.' }
    }
    return { error: 'Registrierung fehlgeschlagen. Bitte versuche es erneut.' }
  }

  if (!authData.user) {
    return { error: 'Registrierung fehlgeschlagen.' }
  }

  // 2. Tenant + User-Profil anlegen (via Service Role, umgeht RLS)
  const tenantResult = await createTenantAndProfile({
    userId: authData.user.id,
    email: parsed.data.email,
    name: parsed.data.name,
    tenantName: parsed.data.practiceName,
    tenantSlug: slugify(parsed.data.practiceName),
  })

  if (tenantResult.error) {
    return { error: tenantResult.error }
  }

  // 3. E-Mail-Bestätigung abwarten (Supabase sendet automatisch)
  redirect('/login?registered=1')
}

// ── Reset Password ────────────────────────────────────────────────────────────

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = ResetPasswordSchema.safeParse({
    email: formData.get('email'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/update`,
  })

  if (error) {
    return { error: 'Anfrage fehlgeschlagen. Bitte versuche es erneut.' }
  }

  return { success: 'Falls ein Account mit dieser E-Mail existiert, erhältst du in Kürze eine E-Mail.' }
}

// ── Logout ────────────────────────────────────────────────────────────────────

export async function logoutAction(): Promise<never> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
