import { getTenantProfile } from '@/modules/settings/queries'
import { ProfileForm } from './profile-form'

export default async function ProfileSettingsPage() {
  const profile = await getTenantProfile()
  return <ProfileForm profile={profile} />
}
