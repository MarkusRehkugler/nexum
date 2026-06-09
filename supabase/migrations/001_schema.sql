-- Nexum · Datenbank-Schema · Migration 001
-- Alle kritischen Regeln aus CLAUDE.md:
-- 1. Kein FLOAT für Geldbeträge (NUMERIC(15,2) oder amount_cents INTEGER)
-- 2. Kein physisches DELETE (deleted_at TIMESTAMP für Soft-Delete)
-- 3. tenant_id in jeder Tabelle
-- 4. Audit-Log append-only
-- 5. M44-Datenstruktur ab Phase 1 anlegen

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector"; -- pgvector für semantische Suche

-- ============================================================
-- A) PLATTFORM-FUNDAMENT
-- ============================================================

CREATE TABLE tenants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(255) NOT NULL,
  slug           VARCHAR(100) UNIQUE NOT NULL,
  plan_tier      VARCHAR(50)  NOT NULL DEFAULT 'starter',
  settings       JSONB        NOT NULL DEFAULT '{}',
  feature_flags  JSONB        NOT NULL DEFAULT '{}',
  billing_data   JSONB        NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

-- Erweitert auth.users von Supabase (password_hash liegt in auth.users)
CREATE TABLE user_profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id       UUID         NOT NULL REFERENCES tenants(id),
  email           VARCHAR(255) NOT NULL,
  role            VARCHAR(50)  NOT NULL DEFAULT 'coach'
                               CHECK (role IN ('owner', 'admin', 'coach', 'assistant', 'accounting', 'supervisor', 'support')),
  profile         JSONB        NOT NULL DEFAULT '{}',
  totp_secret_encrypted TEXT,
  timezone        VARCHAR(100) NOT NULL DEFAULT 'Europe/Berlin',
  locale          VARCHAR(10)  NOT NULL DEFAULT 'de',
  last_active_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE saas_customers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID UNIQUE  NOT NULL REFERENCES tenants(id),
  plan_id             VARCHAR(100) NOT NULL DEFAULT 'starter',
  subscription_status VARCHAR(50)  NOT NULL DEFAULT 'trial'
                                   CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled', 'paused')),
  mrr                 NUMERIC(15,2) NOT NULL DEFAULT 0,
  trial_ends_at       TIMESTAMPTZ,
  feature_overrides   JSONB        NOT NULL DEFAULT '{}',
  stripe_customer_id  VARCHAR(255),
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- B) KLIENTEN- UND FALLARBEIT
-- ============================================================

CREATE TABLE clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id),
  assigned_user_id UUID       REFERENCES user_profiles(id),
  display_label   VARCHAR(255) NOT NULL,
  -- personal_data: verschlüsselt auf Application-Level (Name, Adresse, Geburtsdatum etc.)
  personal_data   JSONB        NOT NULL DEFAULT '{}',
  consent_records JSONB        NOT NULL DEFAULT '{}',
  status          VARCHAR(50)  NOT NULL DEFAULT 'active'
                               CHECK (status IN ('active', 'inactive', 'archived')),
  tags            TEXT[]       NOT NULL DEFAULT '{}',
  source_channel  VARCHAR(100),
  anonymized_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE cases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id),
  client_id       UUID        NOT NULL REFERENCES clients(id),
  owner_user_id   UUID        NOT NULL REFERENCES user_profiles(id),
  profession_type VARCHAR(50) NOT NULL DEFAULT 'coaching'
                              CHECK (profession_type IN ('coaching', 'heilpraktik', 'training', 'education', 'other')),
  -- anamnesis: verschlüsselt auf Application-Level
  anamnesis       JSONB,
  status          VARCHAR(50) NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'completed', 'paused', 'canceled')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE care_plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id),
  case_id     UUID        NOT NULL REFERENCES cases(id),
  goals       JSONB       NOT NULL DEFAULT '[]',
  methods     TEXT,
  milestones  JSONB       NOT NULL DEFAULT '[]',
  risks       TEXT,
  signed_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

-- ============================================================
-- C) SITZUNGEN & KI
-- ============================================================

CREATE TABLE sessions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID        NOT NULL REFERENCES tenants(id),
  case_id                UUID        NOT NULL REFERENCES cases(id),
  user_id                UUID        NOT NULL REFERENCES user_profiles(id),
  type                   VARCHAR(50) NOT NULL DEFAULT 'individual'
                                     CHECK (type IN ('individual', 'group', 'online', 'phone', 'other')),
  session_date           TIMESTAMPTZ NOT NULL,
  duration_minutes       INTEGER,
  -- notes_raw und notes_structured: verschlüsselt auf Application-Level
  notes_raw              TEXT,
  notes_structured       JSONB,
  audio_storage_key      TEXT,        -- verschlüsselt auf Application-Level, Pfad in S3
  ai_processing_status   VARCHAR(50) NOT NULL DEFAULT 'none'
                                     CHECK (ai_processing_status IN ('none', 'pending', 'processing', 'completed', 'failed')),
  status                 VARCHAR(50) NOT NULL DEFAULT 'completed'
                                     CHECK (status IN ('draft', 'completed', 'billed')),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at             TIMESTAMPTZ
);

CREATE TABLE ai_session_results (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID        NOT NULL REFERENCES tenants(id),
  session_id           UUID        NOT NULL REFERENCES sessions(id),
  -- transcript: verschlüsselt auf Application-Level
  transcript           TEXT,
  summary              TEXT,
  extracted_tasks      JSONB       NOT NULL DEFAULT '[]',
  -- suggested_followup: verschlüsselt auf Application-Level
  suggested_followup   TEXT,
  followup_mail_draft  TEXT,
  reviewed_by_user_at  TIMESTAMPTZ,
  model_used           VARCHAR(100),
  processing_seconds   INTEGER,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE client_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id),
  session_id      UUID        REFERENCES sessions(id),
  client_id       UUID        NOT NULL REFERENCES clients(id),
  type            VARCHAR(50) NOT NULL DEFAULT 'exercise'
                              CHECK (type IN ('exercise', 'meditation', 'audio', 'journal', 'reflection', 'affirmation', 'other')),
  content         TEXT        NOT NULL,
  due_date        DATE,
  status          VARCHAR(50) NOT NULL DEFAULT 'open'
                              CHECK (status IN ('open', 'completed', 'skipped')),
  client_response TEXT,
  coach_feedback  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE tracking_metrics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id),
  client_id   UUID        NOT NULL REFERENCES clients(id),
  name        VARCHAR(255) NOT NULL,
  type        VARCHAR(50) NOT NULL CHECK (type IN ('scale', 'boolean', 'numeric', 'text')),
  frequency   VARCHAR(50) NOT NULL DEFAULT 'daily',
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE TABLE tracking_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id),
  metric_id   UUID        NOT NULL REFERENCES tracking_metrics(id),
  client_id   UUID        NOT NULL REFERENCES clients(id),
  value       JSONB       NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- D) KOMMUNIKATION & DOKUMENTE
-- ============================================================

CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id),
  owner_type      VARCHAR(50) NOT NULL CHECK (owner_type IN ('client', 'case', 'session', 'invoice', 'tenant')),
  owner_id        UUID        NOT NULL,
  type            VARCHAR(100) NOT NULL,
  -- storage_key: verschlüsselt auf Application-Level (S3-Pfad)
  storage_key     TEXT        NOT NULL,
  filename        VARCHAR(255),
  mime_type       VARCHAR(100),
  file_size_bytes INTEGER,
  version         INTEGER     NOT NULL DEFAULT 1,
  retention_until DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

-- ============================================================
-- E) TERMINE & RESSOURCEN
-- ============================================================

CREATE TABLE calendar_entries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID        NOT NULL REFERENCES tenants(id),
  user_id           UUID        NOT NULL REFERENCES user_profiles(id),
  session_id        UUID        REFERENCES sessions(id),
  client_id         UUID        REFERENCES clients(id),
  type              VARCHAR(50) NOT NULL DEFAULT 'session'
                                CHECK (type IN ('session', 'block', 'event', 'reminder')),
  title             VARCHAR(255) NOT NULL,
  description       TEXT,
  starts_at         TIMESTAMPTZ NOT NULL,
  ends_at           TIMESTAMPTZ NOT NULL,
  recurrence_rule   TEXT,       -- RRULE-String (z.B. FREQ=WEEKLY;BYDAY=MO)
  external_sync_id  VARCHAR(255),
  external_provider VARCHAR(50) CHECK (external_provider IN ('google', 'microsoft', 'apple', NULL)),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

-- ============================================================
-- F) ABRECHNUNG & FINANZEN (NIEMALS FLOAT!)
-- ============================================================

CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID          NOT NULL REFERENCES tenants(id),
  client_id       UUID          NOT NULL REFERENCES clients(id),
  invoice_number  VARCHAR(50)   UNIQUE NOT NULL,
  line_items      JSONB         NOT NULL DEFAULT '[]',
  tax_mode        VARCHAR(50)   NOT NULL DEFAULT 'none'
                                CHECK (tax_mode IN ('none', 'included', 'excluded')),
  tax_rate        NUMERIC(5,2)  NOT NULL DEFAULT 0,
  subtotal_net    NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_amount      NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_gross     NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency        VARCHAR(3)    NOT NULL DEFAULT 'EUR',
  status          VARCHAR(50)   NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'canceled')),
  due_date        DATE,
  paid_at         TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

-- Zahlungen immer als Cent-Integer + ISO-4217-Währungscode
CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID        NOT NULL REFERENCES tenants(id),
  invoice_id          UUID        NOT NULL REFERENCES invoices(id),
  provider            VARCHAR(50) NOT NULL DEFAULT 'manual',
  provider_payment_id VARCHAR(255),
  amount_cents        INTEGER     NOT NULL,
  currency            VARCHAR(3)  NOT NULL DEFAULT 'EUR',
  status              VARCHAR(50) NOT NULL DEFAULT 'completed',
  paid_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- K) WISSEN & AUTOMATISIERUNG
-- ============================================================

CREATE TABLE knowledge_articles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID         NOT NULL REFERENCES tenants(id),
  title       VARCHAR(255) NOT NULL,
  body        TEXT         NOT NULL,
  visibility  VARCHAR(50)  NOT NULL DEFAULT 'private'
                           CHECK (visibility IN ('private', 'team', 'public')),
  embedding   vector(1536), -- pgvector für semantische Suche (M12/M13)
  version     INTEGER      NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE TABLE automation_rules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        NOT NULL REFERENCES tenants(id),
  trigger_type  VARCHAR(100) NOT NULL,
  conditions    JSONB        NOT NULL DEFAULT '{}',
  actions       JSONB        NOT NULL DEFAULT '[]',
  is_active     BOOLEAN      NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

-- ============================================================
-- AUDIT-LOG (APPEND-ONLY — niemals UPDATE oder DELETE!)
-- ============================================================

CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id),
  user_id     UUID        REFERENCES user_profiles(id),
  action      VARCHAR(50) NOT NULL
              CHECK (action IN ('READ', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'LOGIN', 'LOGOUT', 'AI_PROCESS')),
  entity_type VARCHAR(100) NOT NULL,
  entity_id   UUID,
  diff        JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- KEIN updated_at, KEIN deleted_at — append-only ist Pflicht
);

-- ============================================================
-- M44: OUTCOME-DATENSTRUKTUR (Phase 1 anlegen, Frontend kommt Phase 5)
-- ============================================================

CREATE TABLE outcome_goals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id),
  case_id      UUID        NOT NULL REFERENCES cases(id),
  description  TEXT        NOT NULL,
  method_tags  TEXT[]      NOT NULL DEFAULT '{}',
  target_value JSONB,
  achieved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE session_method_tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID        NOT NULL REFERENCES tenants(id),
  session_id UUID        NOT NULL REFERENCES sessions(id),
  tags       TEXT[]      NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_user_profiles_tenant ON user_profiles(tenant_id);
CREATE INDEX idx_clients_tenant ON clients(tenant_id);
CREATE INDEX idx_clients_assigned_user ON clients(assigned_user_id);
CREATE INDEX idx_cases_tenant ON cases(tenant_id);
CREATE INDEX idx_cases_client ON cases(client_id);
CREATE INDEX idx_sessions_tenant ON sessions(tenant_id);
CREATE INDEX idx_sessions_case ON sessions(case_id);
CREATE INDEX idx_sessions_date ON sessions(session_date DESC);
CREATE INDEX idx_ai_results_session ON ai_session_results(session_id);
CREATE INDEX idx_client_tasks_client ON client_tasks(client_id);
CREATE INDEX idx_client_tasks_session ON client_tasks(session_id);
CREATE INDEX idx_documents_owner ON documents(owner_type, owner_id);
CREATE INDEX idx_calendar_entries_user_date ON calendar_entries(user_id, starts_at);
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_audit_log_tenant_date ON audit_log(tenant_id, created_at DESC);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_knowledge_articles_tenant ON knowledge_articles(tenant_id);
CREATE INDEX idx_outcome_goals_case ON outcome_goals(case_id);
CREATE INDEX idx_session_method_tags_session ON session_method_tags(session_id);

-- Soft-Delete-Filter-Indexes
CREATE INDEX idx_clients_active ON clients(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_cases_active ON cases(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_sessions_active ON sessions(tenant_id) WHERE deleted_at IS NULL;

-- pgvector Index für semantische Suche
CREATE INDEX idx_knowledge_articles_embedding ON knowledge_articles
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Updated-at Trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_cases_updated_at
  BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_care_plans_updated_at
  BEFORE UPDATE ON care_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_sessions_updated_at
  BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_ai_session_results_updated_at
  BEFORE UPDATE ON ai_session_results FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_client_tasks_updated_at
  BEFORE UPDATE ON client_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_calendar_entries_updated_at
  BEFORE UPDATE ON calendar_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_knowledge_articles_updated_at
  BEFORE UPDATE ON knowledge_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_automation_rules_updated_at
  BEFORE UPDATE ON automation_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_saas_customers_updated_at
  BEFORE UPDATE ON saas_customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
