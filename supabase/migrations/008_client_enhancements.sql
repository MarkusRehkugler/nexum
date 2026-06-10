-- Document notes field for optional comments on uploaded files
ALTER TABLE documents ADD COLUMN IF NOT EXISTS notes TEXT;

-- Allow manual tasks without a client link (KI-tasks always have one, manual ones may not)
ALTER TABLE client_tasks ALTER COLUMN client_id DROP NOT NULL;

-- Configurable label for what the tenant calls their clients ("Klient", "Patient", "Coachee" …)
ALTER TABLE tenant_profiles ADD COLUMN IF NOT EXISTS client_label VARCHAR(50) NOT NULL DEFAULT 'Klient';
