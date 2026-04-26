-- ============================================================
-- MIGRATION 005: RLS Security Patch
-- ============================================================
-- Tiga perbaikan keamanan berdasarkan hasil audit Langkah 18:
--   1. get_user_role() kini memeriksa aktif = true
--   2. UPDATE policies di tabel soft-delete kini punya WITH CHECK
--      sehingga non-admin tidak bisa set deleted_at lewat raw API
--   3. penjualan_item UPDATE policy kini memeriksa parent tidak dihapus

-- ── 1. Patch get_user_role() ────────────────────────────────
-- Tanpa pengecekan aktif, user yang di-nonaktifkan tapi masih
-- punya JWT aktif (max ~1 jam) bisa lolos RLS berbasis role.
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
  SELECT role FROM profiles WHERE id = auth.uid() AND aktif = true;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── 2. Tambah WITH CHECK pada UPDATE policies ────────────────
-- WITH CHECK berlaku untuk baris BARU (setelah update).
-- Kondisi: deleted_at IS NULL (update biasa) ATAU admin (soft-delete).
-- USING tetap deleted_at IS NULL agar baris yang sudah dihapus
-- tidak bisa diupdate oleh siapapun.

-- supplier
DROP POLICY IF EXISTS "supplier_update" ON supplier;
CREATE POLICY "supplier_update"
  ON supplier FOR UPDATE
  TO authenticated
  USING (deleted_at IS NULL)
  WITH CHECK (deleted_at IS NULL OR get_user_role() = 'admin');

-- pelanggan
DROP POLICY IF EXISTS "pelanggan_update" ON pelanggan;
CREATE POLICY "pelanggan_update"
  ON pelanggan FOR UPDATE
  TO authenticated
  USING (deleted_at IS NULL)
  WITH CHECK (deleted_at IS NULL OR get_user_role() = 'admin');

-- kategori_produk
DROP POLICY IF EXISTS "kategori_produk_update" ON kategori_produk;
CREATE POLICY "kategori_produk_update"
  ON kategori_produk FOR UPDATE
  TO authenticated
  USING (deleted_at IS NULL)
  WITH CHECK (deleted_at IS NULL OR get_user_role() = 'admin');

-- produk
DROP POLICY IF EXISTS "produk_update" ON produk;
CREATE POLICY "produk_update"
  ON produk FOR UPDATE
  TO authenticated
  USING (deleted_at IS NULL)
  WITH CHECK (deleted_at IS NULL OR get_user_role() = 'admin');

-- karyawan
DROP POLICY IF EXISTS "karyawan_update" ON karyawan;
CREATE POLICY "karyawan_update"
  ON karyawan FOR UPDATE
  TO authenticated
  USING (deleted_at IS NULL)
  WITH CHECK (deleted_at IS NULL OR get_user_role() = 'admin');

-- absensi
DROP POLICY IF EXISTS "absensi_update" ON absensi;
CREATE POLICY "absensi_update"
  ON absensi FOR UPDATE
  TO authenticated
  USING (deleted_at IS NULL)
  WITH CHECK (deleted_at IS NULL OR get_user_role() = 'admin');

-- ── 3. Fix penjualan_item UPDATE ────────────────────────────
-- Policy lama USING (true) membolehkan update item dari penjualan
-- yang sudah soft-deleted. Samakan dengan policy SELECT-nya.
DROP POLICY IF EXISTS "penjualan_item_update" ON penjualan_item;
CREATE POLICY "penjualan_item_update"
  ON penjualan_item FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM penjualan p
      WHERE p.id = penjualan_item.penjualan_id
        AND p.deleted_at IS NULL
    )
  );
