import { createAdminClient } from '@/lib/supabase/server'

export interface TenantAdminView {
  id: string
  name: string
  slug: string
  plan_tier: string
  created_at: string
  deleted_at: string | null
  plan_id: string | null
  subscription_status: string | null
  mrr: number | null
  trial_ends_at: string | null
  client_count: number
  user_count: number
}

export async function getAllTenantsAdmin(): Promise<TenantAdminView[]> {
  const admin = createAdminClient()

  const [{ data: tenants }, { data: customers }, { data: clientCounts }, { data: userCounts }] =
    await Promise.all([
      admin.from('tenants').select('id, name, slug, plan_tier, created_at, deleted_at').order('created_at', { ascending: false }),
      admin.from('saas_customers').select('tenant_id, plan_id, subscription_status, mrr, trial_ends_at'),
      admin.from('clients').select('tenant_id').is('deleted_at', null),
      admin.from('user_profiles').select('tenant_id').is('deleted_at', null),
    ])

  const customerMap = new Map((customers ?? []).map(c => [c.tenant_id, c]))
  const clientMap = new Map<string, number>()
  const userMap = new Map<string, number>()

  for (const c of clientCounts ?? []) {
    clientMap.set(c.tenant_id, (clientMap.get(c.tenant_id) ?? 0) + 1)
  }
  for (const u of userCounts ?? []) {
    userMap.set(u.tenant_id, (userMap.get(u.tenant_id) ?? 0) + 1)
  }

  return (tenants ?? []).map(t => {
    const sc = customerMap.get(t.id)
    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      plan_tier: t.plan_tier,
      created_at: t.created_at,
      deleted_at: t.deleted_at,
      plan_id: sc?.plan_id ?? null,
      subscription_status: sc?.subscription_status ?? null,
      mrr: sc?.mrr ? Number(sc.mrr) : null,
      trial_ends_at: sc?.trial_ends_at ?? null,
      client_count: clientMap.get(t.id) ?? 0,
      user_count: userMap.get(t.id) ?? 0,
    }
  })
}

export async function getAdminStats() {
  const admin = createAdminClient()

  const [{ count: tenantCount }, { count: clientCount }, { data: mrrData }] = await Promise.all([
    admin.from('tenants').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    admin.from('clients').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    admin.from('saas_customers').select('mrr').eq('subscription_status', 'active'),
  ])

  const totalMrr = (mrrData ?? []).reduce((sum, r) => sum + Number(r.mrr), 0)

  return {
    tenantCount: tenantCount ?? 0,
    clientCount: clientCount ?? 0,
    totalMrr,
  }
}
