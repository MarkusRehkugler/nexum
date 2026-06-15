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

/** Nächste Rechnungsnummer für diesen Tenant: PREFIX-YYYY-NNN (atomisch via DB-Sequenz) */
export async function getNextInvoiceNumber(tenantId: string): Promise<string> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_next_invoice_number', { p_tenant_id: tenantId })
  if (error || !data) {
    console.error('getNextInvoiceNumber error:', error)
    return `RE-${new Date().getFullYear()}-001`
  }
  return data as string
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
// Sitzungs-Abrechnung (M22)
// ============================================================

export interface UnbilledSession {
  id: string
  session_date: string
  type: string
  duration_minutes: number | null
  status: string
  invoice_id: string | null
  case: {
    id: string
    client_id: string
    client: {
      id: string
      display_label: string
      personal_data: { name?: string }
    }
  }
}

export async function getUnbilledSessions(clientId?: string): Promise<UnbilledSession[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id,
      session_date,
      type,
      duration_minutes,
      status,
      invoice_id,
      case:cases (
        id,
        client_id,
        client:clients (
          id,
          display_label,
          personal_data
        )
      )
    `)
    .is('deleted_at', null)
    .is('invoice_id', null)
    .in('status', ['completed', 'draft'])
    .order('session_date', { ascending: false })

  if (error) {
    console.error('getUnbilledSessions error:', error)
    return []
  }

  let sessions = (data ?? []) as unknown as UnbilledSession[]
  if (clientId) {
    sessions = sessions.filter(s => s.case?.client_id === clientId)
  }
  return sessions
}

export async function getSessionsByIds(ids: string[]): Promise<UnbilledSession[]> {
  if (!ids.length) return []
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id,
      session_date,
      type,
      duration_minutes,
      status,
      invoice_id,
      case:cases (
        id,
        client_id,
        client:clients (
          id,
          display_label,
          personal_data
        )
      )
    `)
    .in('id', ids)
    .is('deleted_at', null)

  if (error) {
    console.error('getSessionsByIds error:', error)
    return []
  }

  return (data ?? []) as unknown as UnbilledSession[]
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
