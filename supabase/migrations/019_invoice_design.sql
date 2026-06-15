-- Migration 019: Invoice design customization
-- Adds logo, accent color, and footer toggle to tenant_profiles

ALTER TABLE tenant_profiles
  ADD COLUMN IF NOT EXISTS logo_storage_key     TEXT,
  ADD COLUMN IF NOT EXISTS logo_position        TEXT    NOT NULL DEFAULT 'left',
  ADD COLUMN IF NOT EXISTS invoice_accent_color TEXT    NOT NULL DEFAULT '#18181b',
  ADD COLUMN IF NOT EXISTS invoice_show_footer  BOOLEAN NOT NULL DEFAULT true;

-- Public bucket for tenant logos (logos appear on invoices sent to clients, no auth needed)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-logos',
  'tenant-logos',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "logos_tenant_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'tenant-logos' AND
    (storage.foldername(name))[1] = (
      SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "logos_tenant_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'tenant-logos' AND
    (storage.foldername(name))[1] = (
      SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "logos_public_select" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'tenant-logos');
