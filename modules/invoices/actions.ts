'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createInvoiceSchema } from './schemas'
import { getNextInvoiceNumber } from './queries'
import type { LineItem } from './types'

export type CreateInvoiceState = {
  errors?: {
    clientId?: string[]
    lineItems?: string[]
    general?: string[]
  }
}

export async function createInvoiceAction(
  _prev: CreateInvoiceState,
  formData: FormData
): Promise<CreateInvoiceState> {
  // Line-Items aus mehreren Form-Feldern zusammenbauen
  const descriptions = formData.getAll('item_description') as string[]
  const quantities = formData.getAll('item_quantity') as string[]
  const unitPrices = formData.getAll('item_unitPrice') as string[]

  const lineItems = descriptions.map((desc, i) => ({
    description: desc,
    quantity: Number(quantities[i] ?? 1),
    unitPrice: Number(unitPrices[i] ?? 0),
  }))

  const raw = {
    clientId: formData.get('clientId') as string,
    lineItems,
    taxMode: (formData.get('taxMode') as string) || 'none',
    taxRate: Number(formData.get('taxRate') ?? 0),
    dueDate: (formData.get('dueDate') as string) || undefined,
    notes: (formData.get('notes') as string) || undefined,
  }

  const result = createInvoiceSchema.safeParse(raw)
  if (!result.success) {
    const errs = result.error.flatten().fieldErrors
    return { errors: { clientId: errs.clientId, lineItems: errs.lineItems } }
  }

  const { clientId, lineItems: items, taxMode, taxRate, dueDate, notes } = result.data

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { errors: { general: ['Nicht authentifiziert.'] } }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) return { errors: { general: ['Kein Mandant gefunden.'] } }

  // Beträge berechnen
  const computedItems: LineItem[] = items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    total: Math.round(item.quantity * item.unitPrice * 100) / 100,
  }))

  const subtotalNet = computedItems.reduce((s, i) => s + i.total, 0)
  const taxAmount = taxMode === 'none' ? 0 : Math.round(subtotalNet * (taxRate / 100) * 100) / 100
  const totalGross = subtotalNet + (taxMode === 'excluded' ? taxAmount : 0)

  const invoiceNumber = await getNextInvoiceNumber(profile.tenant_id)

  const defaultDue = new Date()
  defaultDue.setDate(defaultDue.getDate() + 14)

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      tenant_id: profile.tenant_id,
      client_id: clientId,
      invoice_number: invoiceNumber,
      line_items: computedItems,
      tax_mode: taxMode,
      tax_rate: taxRate,
      subtotal_net: subtotalNet,
      tax_amount: taxAmount,
      total_gross: totalGross,
      currency: 'EUR',
      status: 'draft',
      due_date: dueDate || defaultDue.toISOString().split('T')[0],
      notes: notes || null,
    })
    .select('id')
    .single()

  if (error || !invoice) {
    console.error('createInvoice error:', error)
    return { errors: { general: ['Rechnung konnte nicht erstellt werden.'] } }
  }

  redirect(`/invoices/${invoice.id}`)
}

export async function markInvoicePaidAction(invoiceId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('invoices')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', invoiceId)

  if (error) return { error: 'Konnte nicht als bezahlt markiert werden.' }
  return {}
}

export async function markInvoiceSentAction(invoiceId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('invoices')
    .update({ status: 'sent' })
    .eq('id', invoiceId)

  if (error) return { error: 'Status konnte nicht aktualisiert werden.' }
  return {}
}
