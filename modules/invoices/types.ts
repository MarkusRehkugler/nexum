export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'canceled'
export type TaxMode = 'none' | 'included' | 'excluded' | 'per_item'

export interface LineItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
  taxRate?: number
}

export interface InvoiceRecord {
  id: string
  tenant_id: string
  client_id: string
  invoice_number: string
  line_items: LineItem[]
  tax_mode: TaxMode
  tax_rate: number
  subtotal_net: number
  tax_amount: number
  total_gross: number
  currency: string
  status: InvoiceStatus
  issued_date: string | null
  service_period_from: string | null
  service_period_to: string | null
  due_date: string | null
  paid_at: string | null
  notes: string | null
  cancels_invoice_id: string | null
  cancellation_reason: string | null
  reminder_1_sent_at: string | null
  reminder_2_sent_at: string | null
  final_notice_sent_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface InvoiceWithClient extends InvoiceRecord {
  client: {
    id: string
    display_label: string
    personal_data: { name?: string; email?: string; address?: string }
  }
  canceled_invoice?: { invoice_number: string } | null
}

export interface CreateInvoiceInput {
  clientId: string
  lineItems: LineItem[]
  taxMode: TaxMode
  taxRate: number
  issuedDate?: string
  servicePeriodFrom?: string
  servicePeriodTo?: string
  dueDate?: string
  notes?: string
}

// ============================================================
// Wiederkehrende Rechnungen
// ============================================================

export type RecurringInterval = 'monthly' | 'quarterly' | 'yearly'

export interface RecurringInvoice {
  id: string
  tenant_id: string
  client_id: string
  line_items: LineItem[]
  tax_mode: TaxMode
  tax_rate: number
  currency: string
  notes: string | null
  interval: RecurringInterval
  day_of_month: number
  next_invoice_date: string
  auto_send: boolean
  active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface RecurringInvoiceWithClient extends RecurringInvoice {
  client: {
    id: string
    display_label: string
    personal_data: { name?: string }
  }
}

// ============================================================
// GebüH (Gebührenordnung für Heilpraktiker)
// ============================================================

export interface GebuhPosition {
  id: string
  ziffer: string
  kurztext: string
  langtext: string | null
  empfehlung_eur: number
  kategorie: string | null
  active: boolean
}
