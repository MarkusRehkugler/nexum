import { getTenantProfile } from '@/modules/settings/queries'
import { InvoiceDesignForm } from './invoice-design-form'

export default async function InvoiceDesignPage() {
  const profile = await getTenantProfile()

  const logoUrl = profile?.logo_storage_key
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/tenant-logos/${profile.logo_storage_key}`
    : null

  return <InvoiceDesignForm profile={profile} logoUrl={logoUrl} />
}
