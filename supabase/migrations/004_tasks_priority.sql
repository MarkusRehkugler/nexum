-- Migration 004: Priority-Spalte für client_tasks
-- Die KI extrahiert Tasks mit Priorität (high/medium/low) — dieses Feld fehlt noch in der Tabelle.

ALTER TABLE client_tasks
  ADD COLUMN IF NOT EXISTS priority VARCHAR(10) NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('high', 'medium', 'low'));
