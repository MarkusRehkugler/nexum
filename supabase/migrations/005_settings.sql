-- Migration 005: Coach-Stammdaten (tenant_profiles) + Leistungskatalog (service_items)

-- ============================================================
-- Coach-Stammdaten für Rechnungsstellung
-- ============================================================
CREATE TABLE IF NOT EXISTS tenant_profiles (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID UNIQUE NOT NULL REFERENCES tenants(id),
  company_name         VARCHAR(255),
  first_name           VARCHAR(100),
  last_name            VARCHAR(100),
  street               VARCHAR(255),
  zip                  VARCHAR(20),
  city                 VARCHAR(100),
  country              VARCHAR(100) NOT NULL DEFAULT 'Deutschland',
  phone                VARCHAR(50),
  email                VARCHAR(255),
  website              VARCHAR(255),
  tax_id               VARCHAR(50),
  vat_id               VARCHAR(50),
  tax_mode             VARCHAR(50) NOT NULL DEFAULT 'kleinunternehmer'
                       CHECK (tax_mode IN ('kleinunternehmer', 'steuerfrei_heilpraktiker', 'regelbesteuerung_19', 'regelbesteuerung_7')),
  bank_name            VARCHAR(100),
  iban                 VARCHAR(50),
  bic                  VARCHAR(20),
  invoice_prefix       VARCHAR(20) NOT NULL DEFAULT 'RE',
  invoice_notes        TEXT,
  payment_terms_days   INTEGER NOT NULL DEFAULT 14,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_tenant_profiles_updated_at
  BEFORE UPDATE ON tenant_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Leistungskatalog
-- ============================================================
CREATE TABLE IF NOT EXISTS service_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  unit_price  NUMERIC(15,2) NOT NULL DEFAULT 0,
  unit        VARCHAR(50) NOT NULL DEFAULT 'Sitzung'
              CHECK (unit IN ('Stunde', 'Sitzung', 'Pauschal', 'Stück', 'Tag', 'Monat')),
  tax_rate    NUMERIC(5,2) NOT NULL DEFAULT 0,
  is_default  BOOLEAN NOT NULL DEFAULT false,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_service_items_tenant ON service_items(tenant_id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_service_items_updated_at
  BEFORE UPDATE ON service_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE tenant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_profiles_tenant ON tenant_profiles
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY service_items_tenant ON service_items
  USING (tenant_id = get_current_tenant_id());
