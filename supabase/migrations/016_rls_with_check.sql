-- Migration 016: Add WITH CHECK to RLS policies missing insert/update protection
-- Affected tables: tenant_profiles, service_items, recurring_invoices,
--                  courses, course_sessions, course_participants

-- ── tenant_profiles ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_profiles_tenant ON tenant_profiles;
CREATE POLICY tenant_profiles_tenant ON tenant_profiles
  USING     (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- ── service_items ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS service_items_tenant ON service_items;
CREATE POLICY service_items_tenant ON service_items
  USING     (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- ── recurring_invoices ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS recurring_invoices_tenant ON recurring_invoices;
CREATE POLICY recurring_invoices_tenant ON recurring_invoices
  USING     (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- ── courses ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "courses_same_tenant" ON courses;
CREATE POLICY "courses_same_tenant" ON courses FOR ALL
  USING     (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- ── course_sessions ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "course_sessions_same_tenant" ON course_sessions;
CREATE POLICY "course_sessions_same_tenant" ON course_sessions FOR ALL
  USING     (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- ── course_participants ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "course_participants_same_tenant" ON course_participants;
CREATE POLICY "course_participants_same_tenant" ON course_participants FOR ALL
  USING     (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
