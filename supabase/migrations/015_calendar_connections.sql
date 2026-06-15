-- Google Calendar OAuth connections (one per tenant per provider)
CREATE TABLE IF NOT EXISTS calendar_connections (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  provider         TEXT NOT NULL DEFAULT 'google' CHECK (provider IN ('google', 'microsoft')),
  access_token     TEXT NOT NULL,
  refresh_token    TEXT,
  token_expires_at TIMESTAMPTZ,
  calendar_id      TEXT NOT NULL DEFAULT 'primary',
  connected_email  TEXT,
  connected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ,
  UNIQUE(tenant_id, provider)
);

ALTER TABLE calendar_entries ADD COLUMN IF NOT EXISTS google_event_id TEXT;

ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON calendar_connections
  USING (
    tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
  );
