export interface TenantProfile {
  id: string
  tenant_id: string
  company_name: string | null
  first_name: string | null
  last_name: string | null
  street: string | null
  zip: string | null
  city: string | null
  country: string
  phone: string | null
  email: string | null
  website: string | null
  tax_id: string | null
  vat_id: string | null
  tax_mode: 'kleinunternehmer' | 'regelbesteuerung_19' | 'heilpraktiker_mix'
  bank_name: string | null
  iban: string | null
  bic: string | null
  invoice_prefix: string
  invoice_notes: string | null
  payment_terms_days: number
  client_label?: string | null
}

export const TAX_MODE_LABELS: Record<TenantProfile['tax_mode'], string> = {
  kleinunternehmer:    'Kleinunternehmer §19 UStG (keine MwSt)',
  regelbesteuerung_19: 'Regelbesteuerung 19% MwSt',
  heilpraktiker_mix:   'Teilweise steuerbefreit §4 Nr. 14 (Heilberufe)',
}

export interface ServiceItem {
  id: string
  tenant_id: string
  name: string
  description: string | null
  unit_price: number
  unit: 'Stunde' | 'Sitzung' | 'Pauschal' | 'Stück' | 'Tag' | 'Monat'
  tax_rate: number
  is_default: boolean
  sort_order: number
  deleted_at: string | null
}

export const UNIT_OPTIONS = ['Stunde', 'Sitzung', 'Pauschal', 'Stück', 'Tag', 'Monat'] as const
