-- Migration 007: Supabase Storage Bucket für Dokumente + RLS

-- 1) Storage-Bucket anlegen (privat, max. 50 MB pro Datei)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documents', 'documents', false, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;

-- 2) Pfadstruktur: {tenant_id}/{uuid}.{ext}
--    RLS prüft: erster Pfadsegment = tenant_id des eingeloggten Users

-- Upload: nur in eigenen Tenant-Ordner
CREATE POLICY "documents_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  split_part(name, '/', 1) = (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

-- Lesen: nur eigene Tenant-Dateien
CREATE POLICY "documents_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  split_part(name, '/', 1) = (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

-- Löschen: nur eigene Tenant-Dateien
CREATE POLICY "documents_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  split_part(name, '/', 1) = (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
);
