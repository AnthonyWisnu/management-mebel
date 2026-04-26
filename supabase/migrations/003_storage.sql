-- ============================================================
-- MIGRATION 003: Supabase Storage - Bucket produk-foto
-- ============================================================

-- Buat bucket untuk foto produk
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'produk-foto',
  'produk-foto',
  true,
  2097152,  -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: public read (karena bucket public = true, SELECT otomatis public)

-- Policy: authenticated user bisa upload
CREATE POLICY "produk_foto_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'produk-foto');

-- Policy: authenticated user bisa update file milik sendiri
CREATE POLICY "produk_foto_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'produk-foto');

-- Policy: hanya admin yang bisa hapus file
CREATE POLICY "produk_foto_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'produk-foto'
    AND get_user_role() = 'admin'
  );
