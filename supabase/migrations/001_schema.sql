-- ============================================================
-- MIGRATION 001: Schema Lengkap Sistem Manajemen Mebel
-- ============================================================

-- ── Helper: auto-set updated_at ────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABEL: profiles (1:1 dengan auth.users)
-- ============================================================
CREATE TABLE profiles (
  id         uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama       text,
  role       text        NOT NULL CHECK (role IN ('admin', 'pegawai')) DEFAULT 'pegawai',
  aktif      boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Auto-insert ke profiles saat user baru dibuat via auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nama, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama', split_part(NEW.email, '@', 1)),
    'pegawai'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Helper: get role dari user yang sedang login ─────────────
-- Dibuat SETELAH tabel profiles karena SQL function divalidasi saat dibuat
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- TABEL: supplier
-- ============================================================
CREATE TABLE supplier (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nama       text        NOT NULL,
  alamat     text,
  no_telp    text,
  email      text,
  catatan    text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz,
  deleted_at timestamptz
);

CREATE TRIGGER set_supplier_updated_at
  BEFORE UPDATE ON supplier
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABEL: karyawan
-- ============================================================
CREATE TABLE karyawan (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nama                text        NOT NULL,
  alamat              text,
  no_telp             text,
  jabatan             text,
  gaji_setengah_hari  numeric(12,2) NOT NULL,
  gaji_satu_hari      numeric(12,2) NOT NULL,
  tanggal_bergabung   date,
  aktif               boolean     NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz,
  deleted_at          timestamptz
);

CREATE TRIGGER set_karyawan_updated_at
  BEFORE UPDATE ON karyawan
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABEL: pelanggan
-- ============================================================
CREATE TABLE pelanggan (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nama       text        NOT NULL,
  alamat     text,
  no_telp    text,
  email      text,
  catatan    text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz,
  deleted_at timestamptz
);

CREATE TRIGGER set_pelanggan_updated_at
  BEFORE UPDATE ON pelanggan
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABEL: kategori_produk
-- ============================================================
CREATE TABLE kategori_produk (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nama       text        NOT NULL UNIQUE,
  deskripsi  text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz,
  deleted_at timestamptz
);

CREATE TRIGGER set_kategori_produk_updated_at
  BEFORE UPDATE ON kategori_produk
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABEL: produk
-- ============================================================
CREATE TABLE produk (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  kategori_id  uuid        NOT NULL REFERENCES kategori_produk(id),
  nama         text        NOT NULL,
  deskripsi    text,
  satuan       text        NOT NULL DEFAULT 'pcs',
  foto_url     text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz,
  deleted_at   timestamptz
);

CREATE INDEX idx_produk_kategori ON produk(kategori_id);

CREATE TRIGGER set_produk_updated_at
  BEFORE UPDATE ON produk
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABEL: pembelian (header)
-- ============================================================
CREATE TABLE pembelian (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  no_faktur    text        UNIQUE,
  tanggal      date        NOT NULL,
  supplier_id  uuid        NOT NULL REFERENCES supplier(id),
  total        numeric(14,2) NOT NULL DEFAULT 0,
  catatan      text,
  dibuat_oleh  uuid        REFERENCES profiles(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz,
  deleted_at   timestamptz
);

CREATE INDEX idx_pembelian_tanggal    ON pembelian(tanggal);
CREATE INDEX idx_pembelian_supplier   ON pembelian(supplier_id);

CREATE TRIGGER set_pembelian_updated_at
  BEFORE UPDATE ON pembelian
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABEL: pembelian_item
-- ============================================================
CREATE TABLE pembelian_item (
  id                 uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  pembelian_id       uuid          NOT NULL REFERENCES pembelian(id) ON DELETE CASCADE,
  produk_id          uuid          NOT NULL REFERENCES produk(id),
  qty                numeric(10,2) NOT NULL,
  harga_beli_satuan  numeric(12,2) NOT NULL,
  subtotal           numeric(14,2) NOT NULL,
  created_at         timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_pembelian_item_pembelian ON pembelian_item(pembelian_id);

-- ============================================================
-- TABEL: penjualan (header)
-- ============================================================
CREATE TABLE penjualan (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  no_faktur        text          UNIQUE,
  tanggal          date          NOT NULL,
  pelanggan_id     uuid          NOT NULL REFERENCES pelanggan(id),
  total_penjualan  numeric(14,2) NOT NULL DEFAULT 0,
  total_hpp        numeric(14,2) NOT NULL DEFAULT 0,
  profit           numeric(14,2) GENERATED ALWAYS AS (total_penjualan - total_hpp) STORED,
  catatan          text,
  dibuat_oleh      uuid          REFERENCES profiles(id),
  created_at       timestamptz   NOT NULL DEFAULT now(),
  updated_at       timestamptz,
  deleted_at       timestamptz
);

CREATE INDEX idx_penjualan_tanggal   ON penjualan(tanggal);
CREATE INDEX idx_penjualan_pelanggan ON penjualan(pelanggan_id);

CREATE TRIGGER set_penjualan_updated_at
  BEFORE UPDATE ON penjualan
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABEL: penjualan_item
-- ============================================================
CREATE TABLE penjualan_item (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  penjualan_id     uuid          NOT NULL REFERENCES penjualan(id) ON DELETE CASCADE,
  produk_id        uuid          NOT NULL REFERENCES produk(id),
  qty              numeric(10,2) NOT NULL,
  harga_jual_satuan numeric(12,2) NOT NULL,
  hpp_satuan       numeric(12,2) NOT NULL DEFAULT 0,
  subtotal_jual    numeric(14,2) NOT NULL,
  subtotal_hpp     numeric(14,2) NOT NULL DEFAULT 0,
  created_at       timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_penjualan_item_penjualan ON penjualan_item(penjualan_id);

-- ============================================================
-- TABEL: absensi
-- ============================================================
CREATE TABLE absensi (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal      date          NOT NULL,
  karyawan_id  uuid          NOT NULL REFERENCES karyawan(id),
  tipe_shift   text          NOT NULL CHECK (tipe_shift IN ('setengah_hari', 'satu_hari', 'lembur')),
  nominal      numeric(12,2) NOT NULL,
  catatan      text,
  dibuat_oleh  uuid          REFERENCES profiles(id),
  created_at   timestamptz   NOT NULL DEFAULT now(),
  updated_at   timestamptz,
  deleted_at   timestamptz
);

CREATE INDEX idx_absensi_karyawan_tanggal ON absensi(karyawan_id, tanggal);
CREATE INDEX idx_absensi_tanggal          ON absensi(tanggal);

CREATE TRIGGER set_absensi_updated_at
  BEFORE UPDATE ON absensi
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABEL: penggajian
-- ============================================================
CREATE TABLE penggajian (
  id                     uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  karyawan_id            uuid          NOT NULL REFERENCES karyawan(id),
  periode_mulai          date          NOT NULL,
  periode_selesai        date          NOT NULL,
  total_gaji_kalkulasi   numeric(14,2) NOT NULL,
  total_dibayar          numeric(14,2) NOT NULL,
  status                 text          NOT NULL CHECK (status IN ('draft', 'dibayar')) DEFAULT 'draft',
  tanggal_bayar          date,
  catatan                text,
  dibuat_oleh            uuid          REFERENCES profiles(id),
  created_at             timestamptz   NOT NULL DEFAULT now(),
  updated_at             timestamptz,
  UNIQUE (karyawan_id, periode_mulai, periode_selesai)
);

CREATE INDEX idx_penggajian_karyawan ON penggajian(karyawan_id);
CREATE INDEX idx_penggajian_periode  ON penggajian(periode_mulai, periode_selesai);

CREATE TRIGGER set_penggajian_updated_at
  BEFORE UPDATE ON penggajian
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
