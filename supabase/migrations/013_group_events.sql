-- Migration 013: Gruppen-Termine (Kurse, Seminare, Gruppen-Sitzungen)

ALTER TABLE calendar_entries
  ADD COLUMN IF NOT EXISTS is_group_event  BOOLEAN  NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS max_participants INTEGER;

CREATE TABLE IF NOT EXISTS group_event_participants (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id),
  entry_id    UUID        NOT NULL REFERENCES calendar_entries(id),
  client_id   UUID        NOT NULL REFERENCES clients(id),
  attended    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  UNIQUE(entry_id, client_id)
);

ALTER TABLE group_event_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_participants_same_tenant"
  ON group_event_participants FOR ALL
  USING (
    tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_group_participants_entry
  ON group_event_participants(entry_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_group_participants_client
  ON group_event_participants(client_id)
  WHERE deleted_at IS NULL;
