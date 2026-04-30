-- ============================================================
-- MIGRATION 012: Penyesuaian Permission Role Pegawai
-- ============================================================
-- Aturan baru:
--   ADMIN    : full CRUD semua modul
--   PEGAWAI  :
--     - Master data (supplier, pelanggan, karyawan, kategori, produk) : READ only
--     - Transaksi penjualan : READ only
--     - Absensi  : bisa tambah & edit (dicabut restriksi dari 009)
--     - Penggajian : bisa tambah, edit, lihat (dicabut restriksi dari 009)
--     - Purchase Order : READ only (sudah benar, tidak berubah)
-- ============================================================

-- ── supplier ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "supplier_insert" ON supplier;
DROP POLICY IF EXISTS "supplier_update" ON supplier;

CREATE POLICY "supplier_insert"
  ON supplier FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "supplier_update"
  ON supplier FOR UPDATE TO authenticated
  USING  (deleted_at IS NULL AND get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ── pelanggan ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "pelanggan_insert" ON pelanggan;
DROP POLICY IF EXISTS "pelanggan_update" ON pelanggan;

CREATE POLICY "pelanggan_insert"
  ON pelanggan FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "pelanggan_update"
  ON pelanggan FOR UPDATE TO authenticated
  USING  (deleted_at IS NULL AND get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ── karyawan ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "karyawan_insert" ON karyawan;
DROP POLICY IF EXISTS "karyawan_update" ON karyawan;

CREATE POLICY "karyawan_insert"
  ON karyawan FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "karyawan_update"
  ON karyawan FOR UPDATE TO authenticated
  USING  (deleted_at IS NULL AND get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ── kategori_produk ───────────────────────────────────────────
DROP POLICY IF EXISTS "kategori_produk_insert" ON kategori_produk;
DROP POLICY IF EXISTS "kategori_produk_update" ON kategori_produk;

CREATE POLICY "kategori_produk_insert"
  ON kategori_produk FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "kategori_produk_update"
  ON kategori_produk FOR UPDATE TO authenticated
  USING  (deleted_at IS NULL AND get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ── produk ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "produk_insert" ON produk;
DROP POLICY IF EXISTS "produk_update" ON produk;

CREATE POLICY "produk_insert"
  ON produk FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "produk_update"
  ON produk FOR UPDATE TO authenticated
  USING  (deleted_at IS NULL AND get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ── penjualan ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "penjualan_insert" ON penjualan;
DROP POLICY IF EXISTS "penjualan_update" ON penjualan;

CREATE POLICY "penjualan_insert"
  ON penjualan FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "penjualan_update"
  ON penjualan FOR UPDATE TO authenticated
  USING  (deleted_at IS NULL AND get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ── penjualan_item ────────────────────────────────────────────
DROP POLICY IF EXISTS "penjualan_item_insert" ON penjualan_item;
DROP POLICY IF EXISTS "penjualan_item_update" ON penjualan_item;

CREATE POLICY "penjualan_item_insert"
  ON penjualan_item FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "penjualan_item_update"
  ON penjualan_item FOR UPDATE TO authenticated
  USING (
    get_user_role() = 'admin' AND
    EXISTS (
      SELECT 1 FROM penjualan p
      WHERE p.id = penjualan_item.penjualan_id AND p.deleted_at IS NULL
    )
  );

-- ── absensi: cabut restriksi dari migration 009 ───────────────
-- Pegawai boleh INSERT dan UPDATE absensi
DROP POLICY IF EXISTS "absensi_insert" ON absensi;
DROP POLICY IF EXISTS "absensi_update" ON absensi;

CREATE POLICY "absensi_insert"
  ON absensi FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "absensi_update"
  ON absensi FOR UPDATE TO authenticated
  USING  (deleted_at IS NULL)
  WITH CHECK (deleted_at IS NULL OR get_user_role() = 'admin');

-- ── penggajian: cabut restriksi dari migration 009 ────────────
-- Pegawai boleh SELECT, INSERT, UPDATE penggajian
DROP POLICY IF EXISTS "penggajian_select"  ON penggajian;
DROP POLICY IF EXISTS "penggajian_insert"  ON penggajian;
DROP POLICY IF EXISTS "penggajian_update"  ON penggajian;

CREATE POLICY "penggajian_select"
  ON penggajian FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "penggajian_insert"
  ON penggajian FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "penggajian_update"
  ON penggajian FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── pembelian: pegawai boleh SELECT (read-only) ───────────────
-- Drop policy admin-only lama, ganti dengan yang mendukung pegawai read
DROP POLICY IF EXISTS "pembelian_select_admin"      ON pembelian;
DROP POLICY IF EXISTS "pembelian_item_select_admin" ON pembelian_item;

CREATE POLICY "pembelian_select"
  ON pembelian FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "pembelian_item_select"
  ON pembelian_item FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pembelian p
      WHERE p.id = pembelian_item.pembelian_id AND p.deleted_at IS NULL
    )
  );
