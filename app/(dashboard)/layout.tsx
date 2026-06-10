import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('profile, role, tenant_id')
    .eq('id', user.id)
    .single()

  const displayName =
    (profile?.profile as { name?: string } | null)?.name ??
    user.email ??
    'Coach'

  const isAdmin = !!process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      {/* Desktop-Sidebar (ab lg) */}
      <div className="hidden lg:flex">
        <Sidebar displayName={displayName} email={user.email ?? ''} isAdmin={isAdmin} />
      </div>

      {/* Hauptinhalt */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-6 pb-24 lg:px-6 lg:py-8 lg:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom-Nav (bis lg) */}
      <MobileNav />
    </div>
  )
}
