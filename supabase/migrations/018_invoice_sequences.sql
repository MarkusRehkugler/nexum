-- Migration 018: Atomic invoice number generation via sequence table
-- Fixes race condition where concurrent requests could produce duplicate numbers

CREATE TABLE IF NOT EXISTS invoice_sequences (
  tenant_id  uuid NOT NULL REFERENCES tenants(id),
  year       int  NOT NULL,
  last_seq   int  NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, year)
);

-- Seed from existing invoices so sequence doesn't restart at 1
INSERT INTO invoice_sequences (tenant_id, year, last_seq)
SELECT
  tenant_id,
  EXTRACT(YEAR FROM created_at)::int AS year,
  COUNT(*) AS last_seq
FROM invoices
WHERE deleted_at IS NULL
GROUP BY tenant_id, EXTRACT(YEAR FROM created_at)::int
ON CONFLICT (tenant_id, year) DO NOTHING;

-- Atomic: INSERT ON CONFLICT DO UPDATE is a single operation, no race window
CREATE OR REPLACE FUNCTION get_next_invoice_number(p_tenant_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year   int  := EXTRACT(YEAR FROM now());
  v_seq    int;
  v_prefix text;
BEGIN
  INSERT INTO invoice_sequences (tenant_id, year, last_seq)
  VALUES (p_tenant_id, v_year, 1)
  ON CONFLICT (tenant_id, year) DO UPDATE
    SET last_seq = invoice_sequences.last_seq + 1
  RETURNING last_seq INTO v_seq;

  SELECT COALESCE(invoice_prefix, 'RE')
  INTO v_prefix
  FROM tenant_profiles
  WHERE tenant_id = p_tenant_id;

  RETURN v_prefix || '-' || v_year || '-' || lpad(v_seq::text, 3, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION get_next_invoice_number(uuid) TO authenticated;
