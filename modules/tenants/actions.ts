'use server'

import { createAdminClient } from '@/lib/supabase/server'

interface CreateTenantInput {
  userId: string
  email: string
  name: string
  tenantName: string
  tenantSlug: string
}

export async function createTenantAndProfile(
  input: CreateTenantInput
): Promise<{ error?: string }> {
  const supabase = createAdminClient()

  // Slug-Konflikte auflösen: nexum → nexum-2 → nexum-3
  let slug = input.tenantSlug
  let attempt = 0
  while (attempt < 10) {
    const { data: existing } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!existing) break
    attempt++
    slug = `${input.tenantSlug}-${attempt + 1}`
  }

  // 1. Tenant anlegen
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name: input.tenantName,
      slug,
      plan_tier: 'trial',
    })
    .select('id')
    .single()

  if (tenantError || !tenant) {
    console.error('Tenant creation failed:', tenantError)
    return { error: 'Tenant konnte nicht angelegt werden.' }
  }

  // 2. User-Profil anlegen
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: input.userId,
      tenant_id: tenant.id,
      email: input.email,
      role: 'owner',
      profile: { name: input.name },
    })

  if (profileError) {
    console.error('Profile creation failed:', profileError)
    // Rollback: Tenant wieder löschen (physisch OK hier, da noch kein Datenbestand)
    await supabase.from('tenants').delete().eq('id', tenant.id)
    return { error: 'Benutzerprofil konnte nicht angelegt werden.' }
  }

  // 3. SaaS-Kundeneintrag anlegen (14-Tage-Trial)
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + 14)

  await supabase.from('saas_customers').insert({
    tenant_id: tenant.id,
    plan_id: 'starter',
    subscription_status: 'trial',
    trial_ends_at: trialEndsAt.toISOString(),
  })

  return {}
}
