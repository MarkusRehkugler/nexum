import { createClient } from '@/lib/supabase/server'
import type { InvoiceWithClient } from './types'

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

/** Nächste Rechnungsnummer für diesen Tenant: YYYY-NNN */
export async function getNextInvoiceNumber(tenantId: string): Promise<string> {
  const supabase = await createClient()
  const year = new Date().getFullYear()

  const { count } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .like('invoice_number', `${year}-%`)

  const seq = ((count ?? 0) + 1).toString().padStart(3, '0')
  return `${year}-${seq}`
}
