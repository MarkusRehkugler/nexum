-- M22: Sitzungs-Abrechnung
-- Verknüpft Sitzungen mit Rechnungen

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id);

CREATE INDEX IF NOT EXISTS idx_sessions_invoice ON sessions(invoice_id) WHERE invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_unbilled ON sessions(tenant_id, status) WHERE deleted_at IS NULL AND invoice_id IS NULL;
