-- ============================================================
-- MIGRATION 002: Row Level Security (RLS) Policies
-- ============================================================

-- ── Aktifkan RLS semua tabel ────────────────────────────────
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier       ENABLE ROW LEVEL SECURITY;
ALTER TABLE karyawan       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pelanggan      ENABLE ROW LEVEL SECURITY;
ALTER TABLE kategori_produk ENABLE ROW LEVEL SECURITY;
ALTER TABLE produk         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pembelian      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pembelian_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE penjualan      ENABLE ROW LEVEL SECURITY;
ALTER TABLE penjualan_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE absensi        ENABLE ROW LEVEL SECURITY;
ALTER TABLE penggajian     ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES: profiles
-- ============================================================
-- User hanya bisa baca profil sendiri
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Admin bisa baca semua profil
CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  USING (get_user_role() = 'admin');

-- User bisa update profil sendiri
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Admin bisa update semua profil
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (get_user_role() = 'admin');

-- Hanya insert via trigger handle_new_user (SECURITY DEFINER)
-- Tidak ada policy INSERT manual untuk profiles

-- ============================================================
-- POLICIES: supplier
-- ============================================================
CREATE POLICY "supplier_select"
  ON supplier FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "supplier_insert"
  ON supplier FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "supplier_update"
  ON supplier FOR UPDATE
  TO authenticated
  USING (deleted_at IS NULL);

-- Soft delete (UPDATE deleted_at): semua auth bisa, tapi di app hanya admin yang punya tombol
-- Hard delete: hanya admin
CREATE POLICY "supplier_delete"
  ON supplier FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================
-- POLICIES: karyawan
-- ============================================================
CREATE POLICY "karyawan_select"
  ON karyawan FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "karyawan_insert"
  ON karyawan FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "karyawan_update"
  ON karyawan FOR UPDATE
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "karyawan_delete"
  ON karyawan FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================
-- POLICIES: pelanggan
-- ============================================================
CREATE POLICY "pelanggan_select"
  ON pelanggan FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "pelanggan_insert"
  ON pelanggan FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "pelanggan_update"
  ON pelanggan FOR UPDATE
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "pelanggan_delete"
  ON pelanggan FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================
-- POLICIES: kategori_produk
-- ============================================================
CREATE POLICY "kategori_produk_select"
  ON kategori_produk FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "kategori_produk_insert"
  ON kategori_produk FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "kategori_produk_update"
  ON kategori_produk FOR UPDATE
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "kategori_produk_delete"
  ON kategori_produk FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================
-- POLICIES: produk
-- ============================================================
CREATE POLICY "produk_select"
  ON produk FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "produk_insert"
  ON produk FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "produk_update"
  ON produk FOR UPDATE
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "produk_delete"
  ON produk FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================
-- POLICIES: pembelian (ADMIN ONLY)
-- ============================================================
CREATE POLICY "pembelian_select_admin"
  ON pembelian FOR SELECT
  TO authenticated
  USING (get_user_role() = 'admin' AND deleted_at IS NULL);

CREATE POLICY "pembelian_insert_admin"
  ON pembelian FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "pembelian_update_admin"
  ON pembelian FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin' AND deleted_at IS NULL);

CREATE POLICY "pembelian_delete_admin"
  ON pembelian FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================
-- POLICIES: pembelian_item (ADMIN ONLY)
-- ============================================================
CREATE POLICY "pembelian_item_select_admin"
  ON pembelian_item FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM pembelian p
      WHERE p.id = pembelian_item.pembelian_id
        AND p.deleted_at IS NULL
    )
  );

CREATE POLICY "pembelian_item_insert_admin"
  ON pembelian_item FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "pembelian_item_update_admin"
  ON pembelian_item FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "pembelian_item_delete_admin"
  ON pembelian_item FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================
-- POLICIES: penjualan
-- ============================================================
CREATE POLICY "penjualan_select"
  ON penjualan FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "penjualan_insert"
  ON penjualan FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "penjualan_update"
  ON penjualan FOR UPDATE
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "penjualan_delete"
  ON penjualan FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================
-- POLICIES: penjualan_item
-- ============================================================
CREATE POLICY "penjualan_item_select"
  ON penjualan_item FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM penjualan p
      WHERE p.id = penjualan_item.penjualan_id
        AND p.deleted_at IS NULL
    )
  );

CREATE POLICY "penjualan_item_insert"
  ON penjualan_item FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "penjualan_item_update"
  ON penjualan_item FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "penjualan_item_delete"
  ON penjualan_item FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================
-- POLICIES: absensi
-- ============================================================
CREATE POLICY "absensi_select"
  ON absensi FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "absensi_insert"
  ON absensi FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "absensi_update"
  ON absensi FOR UPDATE
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "absensi_delete"
  ON absensi FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================
-- POLICIES: penggajian
-- ============================================================
CREATE POLICY "penggajian_select"
  ON penggajian FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "penggajian_insert"
  ON penggajian FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "penggajian_update"
  ON penggajian FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "penggajian_delete"
  ON penggajian FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');
