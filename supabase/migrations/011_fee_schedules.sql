-- Migration 011: Gebührenordnung-Auswahl + GebüH-Berechtigungs-Fix

-- GebüH: RLS aktivieren mit offener Lesepolicy (globale Referenztabelle)
ALTER TABLE gebuh_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY gebuh_read_all ON gebuh_positions FOR SELECT USING (true);
GRANT SELECT ON gebuh_positions TO authenticated;
GRANT SELECT ON gebuh_positions TO anon;

-- Ausgewählte Gebührenordnungen pro Tenant
ALTER TABLE tenant_profiles
  ADD COLUMN IF NOT EXISTS fee_schedules TEXT[] NOT NULL DEFAULT '{}';
