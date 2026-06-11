import { createClient } from '@/lib/supabase/server'
import type { InvoiceWithClient, RecurringInvoiceWithClient, GebuhPosition } from './types'

export async function getInvoices(): Promise<InvoiceWithClient[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      client:clients (
        id,
        display_label,
        personal_data
      )
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getInvoices error:', error)
    return []
  }

  return (data ?? []) as unknown as InvoiceWithClient[]
}

export async function getInvoiceById(id: string): Promise<InvoiceWithClient | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      client:clients (
        id,
        display_label,
        personal_data
      ),
      canceled_invoice:cancels_invoice_id (
        invoice_number
      )
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    console.error('getInvoiceById error:', error)
    return null
  }

  return data as unknown as InvoiceWithClient
}

/** Nächste Rechnungsnummer für diesen Tenant: PREFIX-YYYY-NNN */
export async function getNextInvoiceNumber(tenantId: string): Promise<string> {
  const supabase = await createClient()
  const year = new Date().getFullYear()

  const [{ count }, { data: profileData }] = await Promise.all([
    supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', new Date(year, 0, 1).toISOString())
      .lt('created_at', new Date(year + 1, 0, 1).toISOString()),
    supabase
      .from('tenant_profiles')
      .select('invoice_prefix')
      .eq('tenant_id', tenantId)
      .maybeSingle(),
  ])

  const prefix = (profileData as { invoice_prefix?: string } | null)?.invoice_prefix || 'RE'
  const seq = ((count ?? 0) + 1).toString().padStart(3, '0')
  return `${prefix}-${year}-${seq}`
}

// ============================================================
// Wiederkehrende Rechnungen
// ============================================================

export async function getRecurringInvoices(): Promise<RecurringInvoiceWithClient[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('recurring_invoices')
    .select(`
      *,
      client:clients (
        id,
        display_label,
        personal_data
      )
    `)
    .is('deleted_at', null)
    .order('next_invoice_date', { ascending: true })

  if (error) {
    console.error('getRecurringInvoices error:', error)
    return []
  }

  return (data ?? []) as unknown as RecurringInvoiceWithClient[]
}

export async function getRecurringInvoiceById(id: string): Promise<RecurringInvoiceWithClient | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('recurring_invoices')
    .select(`
      *,
      client:clients (
        id,
        display_label,
        personal_data
      )
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) return null
  return data as unknown as RecurringInvoiceWithClient
}

// ============================================================
// GebüH (Gebührenordnung für Heilpraktiker)
// ============================================================

export async function getGebuhPositions(): Promise<GebuhPosition[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('gebuh_positions')
    .select('*')
    .eq('active', true)
    .order('kategorie', { ascending: true })
    .order('ziffer', { ascending: true })

  if (error) {
    console.error('getGebuhPositions error:', error)
    return []
  }

  return (data ?? []) as GebuhPosition[]
}
