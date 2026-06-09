export interface ClientPersonalData {
  name: string
  email?: string
  phone?: string
  notes?: string
}

export interface ClientRecord {
  id: string
  tenant_id: string
  assigned_user_id: string | null
  display_label: string
  personal_data: ClientPersonalData
  consent_records: Record<string, unknown>
  status: 'active' | 'inactive' | 'archived'
  tags: string[]
  source_channel: string | null
  anonymized_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CreateClientInput {
  name: string
  email?: string
  phone?: string
  notes?: string
}

export interface UpdateClientInput {
  clientId: string
  name?: string
  email?: string
  phone?: string
  notes?: string
  status?: 'active' | 'inactive' | 'archived'
}
