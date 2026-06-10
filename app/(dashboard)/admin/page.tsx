import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAllTenantsAdmin, getAdminStats } from '@/modules/admin/queries'
import { Shield } from 'lucide-react'

function statusLabel(s: string | null) {
  switch (s) {
    case 'trial':    return { label: 'Trial',     cls: 'bg-amber-50 text-amber-700 ring-amber-600/20' }
    case 'active':   return { label: 'Aktiv',     cls: 'bg-green-50 text-green-700 ring-green-600/20' }
    case 'past_due': return { label: 'Überfällig',cls: 'bg-red-50 text-red-700 ring-red-600/20' }
    case 'canceled': return { label: 'Gekündigt', cls: 'bg-zinc-100 text-zinc-500 ring-zinc-500/20' }
    case 'paused':   return { label: 'Pausiert',  cls: 'bg-zinc-100 text-zinc-500 ring-zinc-500/20' }
    default:         return { label: s ?? '—',    cls: 'bg-zinc-100 text-zinc-500 ring-zinc-500/20' }
  }
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtEUR(n: number | null) {
  if (!n) return '—'
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
}

function trialDaysLeft(iso: string | null): string {
  if (!iso) return '—'
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
  if (days < 0) return 'Abgelaufen'
  return `${days}d`
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || user.email !== adminEmail) redirect('/dashboard')

  const [tenants, stats] = await Promise.all([
    getAllTenantsAdmin(),
    getAdminStats(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5 text-violet-600" />
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">SaaS-Admin</h1>
          <p className="text-sm text-zinc-500">Plattformübersicht — nur für Betreiber sichtbar</p>
        </div>
      </div>

      {/* KPI-Kacheln */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tenants',  value: stats.tenantCount },
          { label: 'Klienten gesamt', value: stats.clientCount },
          { label: 'MRR (aktiv)', value: fmtEUR(stats.totalMrr) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Tenant-Tabelle */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100">
              {['Tenant', 'Plan', 'Status', 'Trial endet', 'Klienten', 'User', 'MRR', 'Angelegt'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {tenants.map(t => {
              const { label, cls } = statusLabel(t.subscription_status)
              return (
                <tr key={t.id} className={`hover:bg-zinc-50 transition-colors ${t.deleted_at ? 'opacity-40' : ''}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900">{t.name}</p>
                    <p className="text-xs text-zinc-400">{t.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{t.plan_id ?? t.plan_tier}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
                      {label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 tabular-nums">
                    {t.subscription_status === 'trial' ? trialDaysLeft(t.trial_ends_at) : fmtDate(t.trial_ends_at)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-700">{t.client_count}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-700">{t.user_count}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-700">{fmtEUR(t.mrr)}</td>
                  <td className="px-4 py-3 text-zinc-400 tabular-nums whitespace-nowrap">{fmtDate(t.created_at)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {tenants.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-zinc-400">Noch keine Tenants vorhanden.</p>
        )}
      </div>
    </div>
  )
}
