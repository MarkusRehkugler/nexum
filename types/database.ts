export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          plan_tier: string
          settings: Json
          feature_flags: Json
          billing_data: Json
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          plan_tier?: string
          settings?: Json
          feature_flags?: Json
          billing_data?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>
      }
      user_profiles: {
        Row: {
          id: string
          tenant_id: string
          email: string
          role: UserRole
          profile: Json
          totp_secret_encrypted: string | null
          timezone: string
          locale: string
          last_active_at: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id: string
          tenant_id: string
          email: string
          role?: UserRole
          profile?: Json
          totp_secret_encrypted?: string | null
          timezone?: string
          locale?: string
          last_active_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: Partial<Omit<Database['public']['Tables']['user_profiles']['Insert'], 'id'>>
      }
      clients: {
        Row: {
          id: string
          tenant_id: string
          assigned_user_id: string | null
          display_label: string
          personal_data: Json
          consent_records: Json
          status: ClientStatus
          tags: string[]
          source_channel: string | null
          anonymized_at: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          assigned_user_id?: string | null
          display_label: string
          personal_data?: Json
          consent_records?: Json
          status?: ClientStatus
          tags?: string[]
          source_channel?: string | null
          anonymized_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
      }
      cases: {
        Row: {
          id: string
          tenant_id: string
          client_id: string
          owner_user_id: string
          profession_type: ProfessionType
          anamnesis: Json | null
          status: CaseStatus
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          client_id: string
          owner_user_id: string
          profession_type?: ProfessionType
          anamnesis?: Json | null
          status?: CaseStatus
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['cases']['Insert']>
      }
      sessions: {
        Row: {
          id: string
          tenant_id: string
          case_id: string
          user_id: string
          type: SessionType
          session_date: string
          duration_minutes: number | null
          notes_raw: string | null
          notes_structured: Json | null
          audio_storage_key: string | null
          ai_processing_status: AiProcessingStatus
          status: SessionStatus
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          case_id: string
          user_id: string
          type?: SessionType
          session_date: string
          duration_minutes?: number | null
          notes_raw?: string | null
          notes_structured?: Json | null
          audio_storage_key?: string | null
          ai_processing_status?: AiProcessingStatus
          status?: SessionStatus
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['sessions']['Insert']>
      }
      ai_session_results: {
        Row: {
          id: string
          tenant_id: string
          session_id: string
          transcript: string | null
          summary: string | null
          extracted_tasks: Json
          suggested_followup: string | null
          followup_mail_draft: string | null
          reviewed_by_user_at: string | null
          model_used: string | null
          processing_seconds: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          session_id: string
          transcript?: string | null
          summary?: string | null
          extracted_tasks?: Json
          suggested_followup?: string | null
          followup_mail_draft?: string | null
          reviewed_by_user_at?: string | null
          model_used?: string | null
          processing_seconds?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['ai_session_results']['Insert']>
      }
      client_tasks: {
        Row: {
          id: string
          tenant_id: string
          session_id: string | null
          client_id: string
          type: ClientTaskType
          content: string
          due_date: string | null
          status: ClientTaskStatus
          client_response: string | null
          coach_feedback: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          session_id?: string | null
          client_id: string
          type?: ClientTaskType
          content: string
          due_date?: string | null
          status?: ClientTaskStatus
          client_response?: string | null
          coach_feedback?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['client_tasks']['Insert']>
      }
      invoices: {
        Row: {
          id: string
          tenant_id: string
          client_id: string
          invoice_number: string
          line_items: Json
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
        Insert: {
          id?: string
          tenant_id: string
          client_id: string
          invoice_number: string
          line_items?: Json
          tax_mode?: TaxMode
          tax_rate?: number
          subtotal_net?: number
          tax_amount?: number
          total_gross?: number
          currency?: string
          status?: InvoiceStatus
          due_date?: string | null
          paid_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>
      }
      payments: {
        Row: {
          id: string
          tenant_id: string
          invoice_id: string
          provider: string
          provider_payment_id: string | null
          amount_cents: number
          currency: string
          status: string
          paid_at: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          invoice_id: string
          provider?: string
          provider_payment_id?: string | null
          amount_cents: number
          currency?: string
          status?: string
          paid_at?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
      }
      calendar_entries: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          session_id: string | null
          client_id: string | null
          type: CalendarEntryType
          title: string
          description: string | null
          starts_at: string
          ends_at: string
          recurrence_rule: string | null
          external_sync_id: string | null
          external_provider: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id: string
          session_id?: string | null
          client_id?: string | null
          type?: CalendarEntryType
          title: string
          description?: string | null
          starts_at: string
          ends_at: string
          recurrence_rule?: string | null
          external_sync_id?: string | null
          external_provider?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['calendar_entries']['Insert']>
      }
      documents: {
        Row: {
          id: string
          tenant_id: string
          owner_type: DocumentOwnerType
          owner_id: string
          type: string
          storage_key: string
          filename: string | null
          mime_type: string | null
          file_size_bytes: number | null
          version: number
          retention_until: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          owner_type: DocumentOwnerType
          owner_id: string
          type: string
          storage_key: string
          filename?: string | null
          mime_type?: string | null
          file_size_bytes?: number | null
          version?: number
          retention_until?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['documents']['Insert']>
      }
      audit_log: {
        Row: {
          id: string
          tenant_id: string
          user_id: string | null
          action: AuditAction
          entity_type: string
          entity_id: string | null
          diff: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id?: string | null
          action: AuditAction
          entity_type: string
          entity_id?: string | null
          diff?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: never
      }
      saas_customers: {
        Row: {
          id: string
          tenant_id: string
          plan_id: string
          subscription_status: SubscriptionStatus
          mrr: number
          trial_ends_at: string | null
          feature_overrides: Json
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          plan_id?: string
          subscription_status?: SubscriptionStatus
          mrr?: number
          trial_ends_at?: string | null
          feature_overrides?: Json
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['saas_customers']['Insert']>
      }
      outcome_goals: {
        Row: {
          id: string
          tenant_id: string
          case_id: string
          description: string
          method_tags: string[]
          target_value: Json | null
          achieved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          case_id: string
          description: string
          method_tags?: string[]
          target_value?: Json | null
          achieved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['outcome_goals']['Insert']>
      }
      session_method_tags: {
        Row: {
          id: string
          tenant_id: string
          session_id: string
          tags: string[]
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          session_id: string
          tags?: string[]
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['session_method_tags']['Insert']>
      }
    }
    Functions: {
      get_current_tenant_id: {
        Args: Record<string, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<string, never>
        Returns: string
      }
    }
  }
}

// Enum-Typen
export type UserRole = 'owner' | 'admin' | 'coach' | 'assistant' | 'accounting' | 'supervisor' | 'support'
export type ClientStatus = 'active' | 'inactive' | 'archived'
export type CaseStatus = 'active' | 'completed' | 'paused' | 'canceled'
export type ProfessionType = 'coaching' | 'heilpraktik' | 'training' | 'education' | 'other'
export type SessionType = 'individual' | 'group' | 'online' | 'phone' | 'other'
export type SessionStatus = 'draft' | 'completed' | 'billed'
export type AiProcessingStatus = 'none' | 'pending' | 'processing' | 'completed' | 'failed'
export type ClientTaskType = 'exercise' | 'meditation' | 'audio' | 'journal' | 'reflection' | 'affirmation' | 'other'
export type ClientTaskStatus = 'open' | 'completed' | 'skipped'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'canceled'
export type TaxMode = 'none' | 'included' | 'excluded'
export type CalendarEntryType = 'session' | 'block' | 'event' | 'reminder'
export type DocumentOwnerType = 'client' | 'case' | 'session' | 'invoice' | 'tenant'
export type AuditAction = 'READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'LOGIN' | 'LOGOUT' | 'AI_PROCESS'
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled' | 'paused'

// Row-Typen als Kurzform
export type Tenant = Database['public']['Tables']['tenants']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Case = Database['public']['Tables']['cases']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type AiSessionResult = Database['public']['Tables']['ai_session_results']['Row']
export type ClientTask = Database['public']['Tables']['client_tasks']['Row']
export type Invoice = Database['public']['Tables']['invoices']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type CalendarEntry = Database['public']['Tables']['calendar_entries']['Row']
export type Document = Database['public']['Tables']['documents']['Row']
export type AuditLog = Database['public']['Tables']['audit_log']['Row']
export type SaasCustomer = Database['public']['Tables']['saas_customers']['Row']
export type OutcomeGoal = Database['public']['Tables']['outcome_goals']['Row']
