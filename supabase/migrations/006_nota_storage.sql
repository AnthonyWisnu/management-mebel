-- ============================================================
-- MIGRATION 006: Nota Upload - kolom + bucket storage
-- ============================================================

-- Tambah kolom nota_url ke tabel pembelian
ALTER TABLE pembelian ADD COLUMN IF NOT EXISTS nota_url text;

-- Tambah kolom nota_url ke tabel penjualan
ALTER TABLE penjualan ADD COLUMN IF NOT EXISTS nota_url text;

-- Buat bucket untuk nota transaksi
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nota-transaksi',
  'nota-transaksi',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: authenticated user bisa upload nota
CREATE POLICY "nota_transaksi_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'nota-transaksi');

-- Policy: authenticated user bisa update nota
CREATE POLICY "nota_transaksi_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'nota-transaksi');

-- Policy: hanya admin yang bisa hapus nota
CREATE POLICY "nota_transaksi_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'nota-transaksi'
    AND get_user_role() = 'admin'
  );
