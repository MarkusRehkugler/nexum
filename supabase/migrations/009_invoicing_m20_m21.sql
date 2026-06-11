-- Migration 009: M20 (Rechnungsmodul vollständig) + M21 (Heilpraktiker GebüH)
-- NIEMALS FLOAT für Geld, immer NUMERIC(15,2) oder INTEGER (Cent)

-- ============================================================
-- A) INVOICES — §14 UStG Pflichtfelder + Erweiterungen
-- ============================================================

-- Ausstellungsdatum (kann vom created_at abweichen, z. B. bei nachträglicher Erstellung)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS issued_date DATE;

-- Leistungszeitraum (§14 Abs. 4 Nr. 6 UStG — Pflicht bei abweichendem Zeitraum)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS service_period_from DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS service_period_to   DATE;

-- Stornierung / Gutschrift
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cancels_invoice_id  UUID REFERENCES invoices(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Mahnwesen — Zeitstempel wann Erinnerung versendet wurde
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS reminder_1_sent_at    TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS reminder_2_sent_at    TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS final_notice_sent_at  TIMESTAMPTZ;

-- Fix: per_item-Modus war bisher nicht im DB-Constraint enthalten
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_tax_mode_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_tax_mode_check
  CHECK (tax_mode IN ('none', 'included', 'excluded', 'per_item'));

-- ============================================================
-- B) TENANT_PROFILES — tax_mode Constraint angleichen
-- ============================================================

ALTER TABLE tenant_profiles DROP CONSTRAINT IF EXISTS tenant_profiles_tax_mode_check;
ALTER TABLE tenant_profiles ADD CONSTRAINT tenant_profiles_tax_mode_check
  CHECK (tax_mode IN (
    'kleinunternehmer',
    'steuerfrei_heilpraktiker',
    'regelbesteuerung_19',
    'regelbesteuerung_7'
  ));

-- ============================================================
-- C) WIEDERKEHRENDE RECHNUNGEN
-- ============================================================

CREATE TABLE IF NOT EXISTS recurring_invoices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  client_id        UUID NOT NULL REFERENCES clients(id),
  -- Rechnungsvorlage
  line_items       JSONB         NOT NULL DEFAULT '[]',
  tax_mode         VARCHAR(50)   NOT NULL DEFAULT 'none'
                   CHECK (tax_mode IN ('none', 'included', 'excluded', 'per_item')),
  tax_rate         NUMERIC(5,2)  NOT NULL DEFAULT 0,
  currency         VARCHAR(3)    NOT NULL DEFAULT 'EUR',
  notes            TEXT,
  -- Wiederholungslogik
  interval         VARCHAR(20)   NOT NULL
                   CHECK (interval IN ('monthly', 'quarterly', 'yearly')),
  day_of_month     SMALLINT      NOT NULL DEFAULT 1 CHECK (day_of_month BETWEEN 1 AND 28),
  next_invoice_date DATE         NOT NULL,
  auto_send        BOOLEAN       NOT NULL DEFAULT FALSE,
  active           BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY recurring_invoices_tenant ON recurring_invoices
  USING (tenant_id = get_current_tenant_id());

CREATE INDEX IF NOT EXISTS idx_recurring_invoices_tenant
  ON recurring_invoices(tenant_id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_recurring_invoices_updated_at
  BEFORE UPDATE ON recurring_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- D) GEBüH-POSITIONEN (Gebührenordnung für Heilpraktiker)
-- Diese Tabelle ist tenant-unabhängig (globales Referenz-Verzeichnis)
-- ============================================================

CREATE TABLE IF NOT EXISTS gebuh_positions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ziffer         VARCHAR(20)   NOT NULL UNIQUE,
  kurztext       VARCHAR(255)  NOT NULL,
  langtext       TEXT,
  empfehlung_eur NUMERIC(10,2) NOT NULL,
  kategorie      VARCHAR(100),
  active         BOOLEAN       NOT NULL DEFAULT TRUE
);

-- GebüH Seed-Daten (BVNH-Empfehlungsgebühren, Stand 2024)
INSERT INTO gebuh_positions (ziffer, kurztext, langtext, empfehlung_eur, kategorie) VALUES
-- Beratung
('1',   'Eingehende Beratung',             'Eingehende, das gewöhnliche Maß übersteigende Beratung, auch nach schriftlichen Unterlagen, ggf. mit Untersuchung (>10 Min.)', 23.10, 'Beratung'),
('2',   'Kurze Beratung',                  'Kurze Beratung oder Auskunft (bis 10 Minuten)', 10.72, 'Beratung'),
('3',   'Ausführliche Anamnese',           'Ausführliche Anamnese einschließlich Befunderhebung bei Erstbehandlung', 46.20, 'Anamnese'),
('4',   'Anamnese ohne Untersuchung',      'Ausführliche Anamnese ohne körperliche Untersuchung', 23.10, 'Anamnese'),
-- Akupunktur
('A1',  'Akupunktur bis 30 min',           'Akupunkturbehandlung (eine oder mehrere Sitzungen bis 30 Minuten)', 30.67, 'Akupunktur'),
('A2',  'Akupunktur ab 30 min',            'Akupunkturbehandlung (ab 30 Minuten)', 46.20, 'Akupunktur'),
('A3',  'Aurikulomedizin',                 'Ohrakupunktur (Aurikulomedizin)', 25.57, 'Akupunktur'),
-- Blutentnahme
('B1',  'Blutentnahme venös',              'Venöse Blutentnahme', 9.26, 'Labor & Blut'),
('B2',  'Blutentnahme kapillär',           'Kapilläre Blutentnahme', 4.63, 'Labor & Blut'),
-- Chirotherapie
('C',   'Chirotherapie',                   'Chirotherapeutische / manualtherapeutische Behandlung', 30.67, 'Manualtherapie'),
-- Darmbehandlung
('D',   'Darmspülung',                     'Colon-Hydro-Therapie / Darmspülung', 46.20, 'Darm'),
-- Eigenbluttherapie
('E',   'Eigenbluttherapie',               'Eigenbluttherapie (intramuskulär)', 30.67, 'Infusion & Injektion'),
-- Fußreflexzone
('F',   'Fußreflexzonenmassage',           'Fußreflexzonentherapie', 15.34, 'Reflextherapie'),
-- Gesprächstherapie
('G',   'Psychoth. Erstgespräch (50 min)', 'Eingehendes psychotherapeutisches / tiefenpsychologisches Erstgespräch (50 Minuten)', 92.40, 'Psychotherapie'),
('G1',  'Psychoth. Folgestunde (50 min)',  'Psychotherapeutische Behandlung, Folgesitzung (50 Minuten)', 61.60, 'Psychotherapie'),
('G2',  'Hypnose',                         'Hypnosebehandlung', 46.20, 'Psychotherapie'),
-- Homöopathie
('H1',  'Homöop. Erstanamnese',            'Eingehende homöopathische Anamnese (bis 2 Stunden)', 92.40, 'Homöopathie'),
('H2',  'Homöop. Verlaufsanamnese',        'Verlaufsanamnese Homöopathie (30–60 Minuten)', 46.20, 'Homöopathie'),
('H3',  'Homöop. Kurzkonsultation',        'Homöopathische Kurzkonsultation (bis 30 Minuten)', 23.10, 'Homöopathie'),
-- Infusion & Injektion
('I',   'Infusion bis 30 min',             'Intravenöse Infusion bis 30 Minuten (inkl. Material)', 15.34, 'Infusion & Injektion'),
('I1',  'Infusion ab 30 min',              'Intravenöse Infusion ab 30 Minuten (inkl. Material)', 25.57, 'Infusion & Injektion'),
('I2',  'Injektion s.c. / i.m.',           'Subkutane oder intramuskuläre Injektion', 8.21, 'Infusion & Injektion'),
('I3',  'Injektion i.v.',                  'Intravenöse Injektion', 15.34, 'Infusion & Injektion'),
-- Physikalische Therapie
('K',   'Kurze physik. Therapie',          'Kurze Anwendung physikalischer Therapie (Strom, Wärme, Kälte)', 12.37, 'Physikalische Therapie'),
('K1',  'Ausf. physik. Therapie',          'Ausführliche physikalische Therapie (Ultraschall, Laser etc.)', 25.57, 'Physikalische Therapie'),
-- Osteopathie
('L',   'Osteopathie',                     'Osteopathische Behandlung', 61.60, 'Osteopathie'),
-- Massage / Manualtherapie
('M',   'Manuelle Therapie / Massage',     'Manuelle Behandlung, Massage, Bindegewebsmassage', 18.50, 'Manualtherapie'),
-- Neuraltherapie
('N',   'Neuraltherapie',                  'Neuraltherapeutische Behandlung (lokale Anästhesie)', 25.57, 'Neuraltherapie'),
-- Ozon
('O',   'Ozon-Therapie',                   'Ozontherapie / Großes Eigenblut', 30.67, 'Ozon'),
-- Schröpfen
('S',   'Schröpfen',                       'Trockenes oder blutiges Schröpfen', 12.37, 'Alternative Heilmethoden'),
-- TCM
('T',   'TCM',                             'Traditionelle Chinesische Medizin (Tuina, Qi Gong, Kräutertherapie)', 30.67, 'TCM'),
-- Ernährungsberatung
('Er',  'Ernährungsberatung',              'Eingehende Ernährungsberatung und Diätetik', 30.67, 'Ernährung'),
-- Hausbesuche / Wegegeld
('Ü',   'Hausbesuch',                      'Besuch beim Patienten außerhalb der Praxis', 25.57, 'Wegegeld & Hausbesuch'),
('Ü1',  'Wegegeld bis 5 km',              'Wegegeld für Hausbesuch bis 5 km', 12.37, 'Wegegeld & Hausbesuch'),
('Ü2',  'Wegegeld 5–15 km',              'Wegegeld für Hausbesuch 5 bis 15 km', 25.57, 'Wegegeld & Hausbesuch'),
('Ü3',  'Wegegeld ab 15 km',             'Wegegeld für Hausbesuch ab 15 km', 38.00, 'Wegegeld & Hausbesuch'),
-- Zuschläge
('Z1',  'Nacht- / Wochenend-Zuschlag',    'Zuschlag für Leistungen außerhalb der regulären Sprechstundenzeiten (Nacht, Wochenende, Feiertag)', 15.34, 'Zuschläge')

ON CONFLICT (ziffer) DO NOTHING;
