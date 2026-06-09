export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'canceled'
export type TaxMode = 'none' | 'included' | 'excluded'

export interface LineItem {
  description: string
  quantity: number
  unitPrice: number   // in EUR (decimal)
  total: number       // quantity * unitPrice
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
  due_date: string | null
  paid_at: string | null
  notes: string | null
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
}

export interface CreateInvoiceInput {
  clientId: string
  lineItems: LineItem[]
  taxMode: TaxMode
  taxRate: number
  dueDate?: string
  notes?: string
}
