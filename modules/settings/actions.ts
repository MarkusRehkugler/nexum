'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { TenantProfile } from './types'

export async function saveTenantProfileAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht angemeldet' }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  if (!profile) return { error: 'Tenant nicht gefunden' }

  const clientLabelRaw = formData.get('client_label') as string
  const payload = {
    tenant_id: profile.tenant_id,
    company_name:        formData.get('company_name') as string || null,
    first_name:          formData.get('first_name') as string || null,
    last_name:           formData.get('last_name') as string || null,
    street:              formData.get('street') as string || null,
    zip:                 formData.get('zip') as string || null,
    city:                formData.get('city') as string || null,
    country:             formData.get('country') as string || 'Deutschland',
    phone:               formData.get('phone') as string || null,
    email:               formData.get('email') as string || null,
    website:             formData.get('website') as string || null,
    tax_id:              formData.get('tax_id') as string || null,
    vat_id:              formData.get('vat_id') as string || null,
    tax_mode:            formData.get('tax_mode') as TenantProfile['tax_mode'],
    bank_name:           formData.get('bank_name') as string || null,
    iban:                formData.get('iban') as string || null,
    bic:                 formData.get('bic') as string || null,
    invoice_prefix:      formData.get('invoice_prefix') as string || 'RE',
    invoice_notes:       formData.get('invoice_notes') as string || null,
    payment_terms_days:  parseInt(formData.get('payment_terms_days') as string) || 14,
    client_label:        clientLabelRaw?.trim() || 'Klient',
    fee_schedules:       formData.getAll('fee_schedules') as string[],
  }

  const { error } = await supabase
    .from('tenant_profiles')
    .upsert(payload, { onConflict: 'tenant_id' })

  if (error) return { error: error.message }

  revalidatePath('/settings/profile')
  return { success: true }
}

export async function createServiceItemAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht angemeldet' }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  if (!profile) return { error: 'Tenant nicht gefunden' }

  const { error } = await supabase.from('service_items').insert({
    tenant_id:   profile.tenant_id,
    name:        formData.get('name') as string,
    description: formData.get('description') as string || null,
    unit_price:  parseFloat(formData.get('unit_price') as string) || 0,
    unit:        formData.get('unit') as string || 'Sitzung',
    tax_rate:    parseFloat(formData.get('tax_rate') as string) || 0,
    is_default:  formData.get('is_default') === 'true',
  })

  if (error) return { error: error.message }

  revalidatePath('/settings/services')
  return { success: true }
}

export async function updateServiceItemAction(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht angemeldet' }

  const { error } = await supabase
    .from('service_items')
    .update({
      name:        formData.get('name') as string,
      description: formData.get('description') as string || null,
      unit_price:  parseFloat(formData.get('unit_price') as string) || 0,
      unit:        formData.get('unit') as string,
      tax_rate:    parseFloat(formData.get('tax_rate') as string) || 0,
      is_default:  formData.get('is_default') === 'true',
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/settings/services')
  return { success: true }
}

export async function deleteServiceItemAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('service_items')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/settings/services')
}

// ── Rechnungsdesign ────────────────────────────────────────────

const LOGO_EXT: Record<string, string> = {
  'image/jpeg':    'jpg',
  'image/png':     'png',
  'image/webp':    'webp',
  'image/svg+xml': 'svg',
}

export async function saveInvoiceDesignAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht angemeldet' }

  const { data: up } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  if (!up) return { error: 'Tenant nicht gefunden' }

  const payload: Record<string, unknown> = {
    tenant_id:            up.tenant_id,
    logo_position:        (formData.get('logo_position') as string) || 'left',
    invoice_accent_color: (formData.get('invoice_accent_color') as string) || '#18181b',
    invoice_show_footer:  formData.get('invoice_show_footer') === 'true',
  }

  const removeLogo = formData.get('remove_logo') === 'true'
  if (removeLogo) {
    payload.logo_storage_key = null
  }

  const file = formData.get('logo') as File | null
  if (file && file.size > 0 && !removeLogo) {
    if (!LOGO_EXT[file.type]) return { error: 'Ungültiger Dateityp. Erlaubt: JPG, PNG, WebP, SVG.' }
    if (file.size > 2 * 1024 * 1024) return { error: 'Logo zu groß (max. 2 MB).' }

    const storagePath = `${up.tenant_id}/logo.${LOGO_EXT[file.type]}`
    const bytes = await file.arrayBuffer()

    const admin = createAdminClient()
    const { error: uploadErr } = await admin.storage
      .from('tenant-logos')
      .upload(storagePath, Buffer.from(bytes), { contentType: file.type, upsert: true })

    if (uploadErr) return { error: 'Logo-Upload fehlgeschlagen.' }
    payload.logo_storage_key = storagePath
  }

  const { error } = await supabase
    .from('tenant_profiles')
    .upsert(payload, { onConflict: 'tenant_id' })

  if (error) return { error: error.message }

  revalidatePath('/settings/invoice')
  revalidatePath('/invoices', 'layout')
  return { success: true }
}
