'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createInvoiceSchema, cancelInvoiceSchema, createRecurringSchema } from './schemas'
import { getNextInvoiceNumber } from './queries'
import type { LineItem, RecurringInterval } from './types'

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
  const descriptions  = formData.getAll('item_description') as string[]
  const quantities    = formData.getAll('item_quantity')    as string[]
  const unitPrices    = formData.getAll('item_unitPrice')   as string[]
  const itemTaxRates  = formData.getAll('item_taxRate')     as string[]

  const lineItems = descriptions.map((desc, i) => ({
    description: desc,
    quantity:    Number(quantities[i]   ?? 1),
    unitPrice:   Number(unitPrices[i]   ?? 0),
    taxRate:     itemTaxRates[i] !== undefined ? Number(itemTaxRates[i]) : undefined,
  }))

  const sessionIds = (formData.getAll('session_id') as string[]).filter(Boolean)

  const raw = {
    clientId:          formData.get('clientId')          as string,
    lineItems,
    taxMode:           (formData.get('taxMode')          as string) || 'none',
    taxRate:           Number(formData.get('taxRate')    ?? 0),
    issuedDate:        (formData.get('issuedDate')       as string) || undefined,
    servicePeriodFrom: (formData.get('servicePeriodFrom') as string) || undefined,
    servicePeriodTo:   (formData.get('servicePeriodTo')   as string) || undefined,
    dueDate:           (formData.get('dueDate')          as string) || undefined,
    notes:             (formData.get('notes')            as string) || undefined,
  }

  const result = createInvoiceSchema.safeParse(raw)
  if (!result.success) {
    const errs = result.error.flatten().fieldErrors
    return { errors: { clientId: errs.clientId, lineItems: errs.lineItems } }
  }

  const { clientId, lineItems: items, taxMode, taxRate, issuedDate,
          servicePeriodFrom, servicePeriodTo, dueDate, notes } = result.data

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { errors: { general: ['Nicht authentifiziert.'] } }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) return { errors: { general: ['Kein Mandant gefunden.'] } }

  const computedItems: LineItem[] = items.map((item) => ({
    description: item.description,
    quantity:    item.quantity,
    unitPrice:   item.unitPrice,
    total:       Math.round(item.quantity * item.unitPrice * 100) / 100,
    taxRate:     item.taxRate,
  }))

  const subtotalNet = computedItems.reduce((s, i) => s + i.total, 0)
  const taxAmount   = taxMode === 'per_item'
    ? computedItems.reduce((s, i) => s + Math.round(i.total * ((i.taxRate ?? 0) / 100) * 100) / 100, 0)
    : taxMode === 'none'
      ? 0
      : Math.round(subtotalNet * (taxRate / 100) * 100) / 100
  const totalGross  = subtotalNet + (taxMode === 'excluded' || taxMode === 'per_item' ? taxAmount : 0)

  const invoiceNumber = await getNextInvoiceNumber(profile.tenant_id)
  const today = new Date().toISOString().split('T')[0]
  const defaultDue = new Date()
  defaultDue.setDate(defaultDue.getDate() + 14)

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      tenant_id:           profile.tenant_id,
      client_id:           clientId,
      invoice_number:      invoiceNumber,
      line_items:          computedItems,
      tax_mode:            taxMode,
      tax_rate:            taxRate,
      subtotal_net:        subtotalNet,
      tax_amount:          taxAmount,
      total_gross:         totalGross,
      currency:            'EUR',
      status:              'draft',
      issued_date:         issuedDate || today,
      service_period_from: servicePeriodFrom || null,
      service_period_to:   servicePeriodTo   || null,
      due_date:            dueDate || defaultDue.toISOString().split('T')[0],
      notes:               notes || null,
    })
    .select('id')
    .single()

  if (error || !invoice) {
    console.error('createInvoice error:', error)
    return { errors: { general: ['Rechnung konnte nicht erstellt werden.'] } }
  }

  // Verknüpfte Sitzungen als abgerechnet markieren
  if (sessionIds.length > 0) {
    await supabase
      .from('sessions')
      .update({ invoice_id: invoice.id, status: 'billed' })
      .in('id', sessionIds)
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
  revalidatePath(`/invoices/${invoiceId}`)
  return {}
}

export async function markInvoiceSentAction(invoiceId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('invoices')
    .update({ status: 'sent' })
    .eq('id', invoiceId)
  if (error) return { error: 'Status konnte nicht aktualisiert werden.' }
  revalidatePath(`/invoices/${invoiceId}`)
  return {}
}

// ============================================================
// Stornierung
// ============================================================

export async function cancelInvoiceAction(
  invoiceId: string,
  formData: FormData
): Promise<{ error?: string; stornoId?: string }> {
  const raw = { reason: (formData.get('reason') as string) || '' }
  const result = cancelInvoiceSchema.safeParse(raw)
  if (!result.success) return { error: 'Ungültige Eingabe.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht authentifiziert.' }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  if (!profile?.tenant_id) return { error: 'Kein Mandant gefunden.' }

  const { data: original, error: fetchErr } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .is('deleted_at', null)
    .single()

  if (fetchErr || !original) return { error: 'Rechnung nicht gefunden.' }
  if (original.status === 'canceled') return { error: 'Rechnung ist bereits storniert.' }

  const stornoItems: LineItem[] = (original.line_items as LineItem[]).map((item) => ({
    ...item,
    total:     -item.total,
    unitPrice: -item.unitPrice,
  }))

  const stornoNumber = await getNextInvoiceNumber(profile.tenant_id)
  const today = new Date().toISOString().split('T')[0]

  const { data: storno, error: stornoErr } = await supabase
    .from('invoices')
    .insert({
      tenant_id:           profile.tenant_id,
      client_id:           original.client_id,
      invoice_number:      stornoNumber,
      line_items:          stornoItems,
      tax_mode:            original.tax_mode,
      tax_rate:            original.tax_rate,
      subtotal_net:        -Number(original.subtotal_net),
      tax_amount:          -Number(original.tax_amount),
      total_gross:         -Number(original.total_gross),
      currency:            original.currency,
      status:              'sent',
      issued_date:         today,
      cancels_invoice_id:  invoiceId,
      cancellation_reason: result.data.reason || null,
      notes:               `Stornierung zu Rechnung ${original.invoice_number}`,
    })
    .select('id')
    .single()

  if (stornoErr || !storno) {
    console.error('cancelInvoice storno error:', stornoErr)
    return { error: 'Stornorechnung konnte nicht erstellt werden.' }
  }

  await supabase
    .from('invoices')
    .update({
      status:              'canceled',
      cancellation_reason: result.data.reason || null,
    })
    .eq('id', invoiceId)

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${invoiceId}`)
  return { stornoId: storno.id }
}

// ============================================================
// Mahnwesen
// ============================================================

export async function sendReminderAction(
  invoiceId: string,
  level: 1 | 2 | 'final'
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const field =
    level === 1      ? 'reminder_1_sent_at'   :
    level === 2      ? 'reminder_2_sent_at'   :
                       'final_notice_sent_at'

  const { error } = await supabase
    .from('invoices')
    .update({ [field]: new Date().toISOString() })
    .eq('id', invoiceId)

  if (error) return { error: 'Mahnung konnte nicht gespeichert werden.' }
  revalidatePath(`/invoices/${invoiceId}`)
  return {}
}

// ============================================================
// Wiederkehrende Rechnungen
// ============================================================

export type CreateRecurringState = {
  errors?: { clientId?: string[]; lineItems?: string[]; general?: string[] }
}

export async function createRecurringInvoiceAction(
  _prev: CreateRecurringState,
  formData: FormData
): Promise<CreateRecurringState> {
  const descriptions = formData.getAll('item_description') as string[]
  const quantities   = formData.getAll('item_quantity')    as string[]
  const unitPrices   = formData.getAll('item_unitPrice')   as string[]
  const itemTaxRates = formData.getAll('item_taxRate')     as string[]

  const lineItems = descriptions.map((desc, i) => ({
    description: desc,
    quantity:    Number(quantities[i]  ?? 1),
    unitPrice:   Number(unitPrices[i]  ?? 0),
    taxRate:     itemTaxRates[i] !== undefined ? Number(itemTaxRates[i]) : undefined,
  }))

  const raw = {
    clientId:        formData.get('clientId')        as string,
    lineItems,
    taxMode:         (formData.get('taxMode')        as string) || 'none',
    taxRate:         Number(formData.get('taxRate')  ?? 0),
    notes:           (formData.get('notes')          as string) || undefined,
    interval:        formData.get('interval')        as RecurringInterval,
    dayOfMonth:      Number(formData.get('dayOfMonth') ?? 1),
    nextInvoiceDate: formData.get('nextInvoiceDate') as string,
    autoSend:        formData.get('autoSend') === 'true',
  }

  const result = createRecurringSchema.safeParse(raw)
  if (!result.success) {
    const errs = result.error.flatten().fieldErrors
    return { errors: { clientId: errs.clientId, lineItems: errs.lineItems } }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { errors: { general: ['Nicht authentifiziert.'] } }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  if (!profile?.tenant_id) return { errors: { general: ['Kein Mandant gefunden.'] } }

  const computedItems: LineItem[] = result.data.lineItems.map((item) => ({
    description: item.description,
    quantity:    item.quantity,
    unitPrice:   item.unitPrice,
    total:       Math.round(item.quantity * item.unitPrice * 100) / 100,
    taxRate:     item.taxRate,
  }))

  const { error } = await supabase
    .from('recurring_invoices')
    .insert({
      tenant_id:          profile.tenant_id,
      client_id:          result.data.clientId,
      line_items:         computedItems,
      tax_mode:           result.data.taxMode,
      tax_rate:           result.data.taxRate,
      currency:           'EUR',
      notes:              result.data.notes || null,
      interval:           result.data.interval,
      day_of_month:       result.data.dayOfMonth,
      next_invoice_date:  result.data.nextInvoiceDate,
      auto_send:          result.data.autoSend,
      active:             true,
    })

  if (error) {
    console.error('createRecurring error:', error)
    return { errors: { general: ['Vorlage konnte nicht gespeichert werden.'] } }
  }

  revalidatePath('/invoices/recurring')
  redirect('/invoices/recurring')
}

export async function toggleRecurringInvoiceAction(
  id: string,
  active: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('recurring_invoices')
    .update({ active })
    .eq('id', id)
  if (error) return { error: 'Status konnte nicht geändert werden.' }
  revalidatePath('/invoices/recurring')
  return {}
}

export async function deleteRecurringInvoiceAction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('recurring_invoices')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: 'Vorlage konnte nicht gelöscht werden.' }
  revalidatePath('/invoices/recurring')
  return {}
}
