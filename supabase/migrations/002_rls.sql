-- Nexum · Row Level Security · Migration 002
-- Multi-Tenancy über RLS — jeder Nutzer sieht nur Daten seines Mandanten
-- Hilfsfunktion liest tenant_id aus user_profiles für den aktuell eingeloggten User

-- ============================================================
-- HILFSFUNKTIONEN
-- ============================================================

-- Gibt die tenant_id des aktuell eingeloggten Users zurück
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id
  FROM user_profiles
  WHERE id = auth.uid()
  LIMIT 1
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Gibt die Rolle des aktuell eingeloggten Users zurück
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS VARCHAR AS $$
  SELECT role
  FROM user_profiles
  WHERE id = auth.uid()
  LIMIT 1
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================
-- RLS AKTIVIEREN
-- ============================================================

ALTER TABLE tenants              ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_customers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients              ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases                ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_plans           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_session_results   ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_tasks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_metrics     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_entries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents            ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_entries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices             ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_articles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log            ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcome_goals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_method_tags  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TENANTS
-- ============================================================

CREATE POLICY "tenant_select_own"
  ON tenants FOR SELECT
  USING (id = get_current_tenant_id());

-- Tenant-Anlage nur durch Service-Role (Onboarding-Flow)
-- Kein direkter INSERT durch App-User

-- ============================================================
-- USER_PROFILES
-- ============================================================

CREATE POLICY "user_profiles_select_same_tenant"
  ON user_profiles FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "user_profiles_update_own"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid() AND tenant_id = get_current_tenant_id());

CREATE POLICY "user_profiles_insert_own"
  ON user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ============================================================
-- SAAS_CUSTOMERS
-- ============================================================

CREATE POLICY "saas_customers_select_own_tenant"
  ON saas_customers FOR SELECT
  USING (tenant_id = get_current_tenant_id());

-- ============================================================
-- CLIENTS
-- ============================================================

CREATE POLICY "clients_all_same_tenant"
  ON clients FOR ALL
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- ============================================================
-- CASES
-- ============================================================

CREATE POLICY "cases_all_same_tenant"
  ON cases FOR ALL
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- ============================================================
-- CARE_PLANS
-- ============================================================

CREATE POLICY "care_plans_all_same_tenant"
  ON care_plans FOR ALL
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- ============================================================
-- SESSIONS
-- ============================================================

CREATE POLICY "sessions_all_same_tenant"
  ON sessions FOR ALL
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- ============================================================
-- AI_SESSION_RESULTS
-- ============================================================

CREATE POLICY "ai_session_results_all_same_tenant"
  ON ai_session_results FOR ALL
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- ============================================================
-- CLIENT_TASKS
-- ============================================================

CREATE POLICY "client_tasks_all_same_tenant"
  ON client_tasks FOR ALL
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- ============================================================
-- TRACKING
-- ============================================================

CREATE POLICY "tracking_metrics_all_same_tenant"
  ON tracking_metrics FOR ALL
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "tracking_entries_all_same_tenant"
  ON tracking_entries FOR ALL
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- ============================================================
-- DOCUMENTS
-- ============================================================

CREATE POLICY "documents_all_same_tenant"
  ON documents FOR ALL
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- ============================================================
-- CALENDAR_ENTRIES
-- ============================================================

CREATE POLICY "calendar_entries_all_same_tenant"
  ON calendar_entries FOR ALL
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- ============================================================
-- INVOICES
-- ============================================================

CREATE POLICY "invoices_all_same_tenant"
  ON invoices FOR ALL
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- ============================================================
-- PAYMENTS
-- ============================================================

CREATE POLICY "payments_all_same_tenant"
  ON payments FOR ALL
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- ============================================================
-- KNOWLEDGE_ARTICLES
-- ============================================================

CREATE POLICY "knowledge_articles_all_same_tenant"
  ON knowledge_articles FOR ALL
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- ============================================================
-- AUTOMATION_RULES
-- ============================================================

CREATE POLICY "automation_rules_all_same_tenant"
  ON automation_rules FOR ALL
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- ============================================================
-- AUDIT_LOG — APPEND-ONLY
-- Nur INSERT und SELECT erlaubt, niemals UPDATE oder DELETE
-- ============================================================

CREATE POLICY "audit_log_insert_same_tenant"
  ON audit_log FOR INSERT
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "audit_log_select_same_tenant"
  ON audit_log FOR SELECT
  USING (tenant_id = get_current_tenant_id());

-- KEIN UPDATE-Policy
-- KEIN DELETE-Policy
-- Erzwungen: keine DB-Rolle kann audit_log ändern

-- ============================================================
-- M44 OUTCOME-TABELLEN
-- ============================================================

CREATE POLICY "outcome_goals_all_same_tenant"
  ON outcome_goals FOR ALL
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "session_method_tags_all_same_tenant"
  ON session_method_tags FOR ALL
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());
