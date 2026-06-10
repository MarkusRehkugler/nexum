-- Migration 006: Steuermodell-Refaktorierung
-- Entfernt steuerfrei_heilpraktiker + regelbesteuerung_7
-- Fügt heilpraktiker_mix hinzu (per-Position Steuersatz)

-- 1) Bestehende Stammdaten-Zeilen migrieren
UPDATE tenant_profiles
  SET tax_mode = 'heilpraktiker_mix'
  WHERE tax_mode = 'steuerfrei_heilpraktiker';

UPDATE tenant_profiles
  SET tax_mode = 'regelbesteuerung_19'
  WHERE tax_mode = 'regelbesteuerung_7';

-- 2) CHECK-Constraint auf tenant_profiles ersetzen
ALTER TABLE tenant_profiles
  DROP CONSTRAINT IF EXISTS tenant_profiles_tax_mode_check;

ALTER TABLE tenant_profiles
  ADD CONSTRAINT tenant_profiles_tax_mode_check
  CHECK (tax_mode IN ('kleinunternehmer', 'regelbesteuerung_19', 'heilpraktiker_mix'));

-- 3) CHECK-Constraint auf invoices erweitern (per_item hinzufügen)
ALTER TABLE invoices
  DROP CONSTRAINT IF EXISTS invoices_tax_mode_check;

ALTER TABLE invoices
  ADD CONSTRAINT invoices_tax_mode_check
  CHECK (tax_mode IN ('none', 'included', 'excluded', 'per_item'));
