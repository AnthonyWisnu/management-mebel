-- ============================================================
-- 010: Hutang Piutang System
-- ============================================================

-- 1. Tambah saldo_kredit ke supplier & pelanggan
ALTER TABLE supplier
  ADD COLUMN saldo_kredit numeric(15,2) NOT NULL DEFAULT 0
    CHECK (saldo_kredit >= 0);

ALTER TABLE pelanggan
  ADD COLUMN saldo_kredit numeric(15,2) NOT NULL DEFAULT 0
    CHECK (saldo_kredit >= 0);

-- 2. Tambah total_dibayar & status_bayar ke penjualan
ALTER TABLE penjualan
  ADD COLUMN total_dibayar  numeric(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN status_bayar   text NOT NULL DEFAULT 'lunas'
    CHECK (status_bayar IN ('lunas', 'sebagian', 'belum_lunas'));

UPDATE penjualan SET total_dibayar = total_penjualan, status_bayar = 'lunas';

-- 3. Tambah total_dibayar & status_bayar ke pembelian
ALTER TABLE pembelian
  ADD COLUMN total_dibayar  numeric(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN status_bayar   text NOT NULL DEFAULT 'lunas'
    CHECK (status_bayar IN ('lunas', 'sebagian', 'belum_lunas'));

UPDATE pembelian SET total_dibayar = total, status_bayar = 'lunas';

-- 4. Tabel hutang_piutang
CREATE TABLE hutang_piutang (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  tipe            text          NOT NULL CHECK (tipe IN ('hutang', 'piutang')),
  sumber          text          NOT NULL CHECK (sumber IN ('penjualan', 'pembelian')),
  sumber_id       uuid          NOT NULL,
  pihak_tipe      text          NOT NULL CHECK (pihak_tipe IN ('pelanggan', 'supplier')),
  pelanggan_id    uuid          REFERENCES pelanggan(id),
  supplier_id     uuid          REFERENCES supplier(id),
  nominal         numeric(15,2) NOT NULL CHECK (nominal > 0),
  saldo_terpakai  numeric(15,2) NOT NULL DEFAULT 0,
  terbayar        numeric(15,2) NOT NULL DEFAULT 0 CHECK (terbayar >= 0),
  status          text          NOT NULL DEFAULT 'belum_lunas'
                    CHECK (status IN ('belum_lunas', 'sebagian', 'lunas')),
  tanggal         date          NOT NULL,
  jatuh_tempo     date,
  catatan         text,
  dibuat_oleh     uuid          REFERENCES profiles(id),
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  CONSTRAINT hp_pihak_check CHECK (
    (pihak_tipe = 'pelanggan' AND pelanggan_id IS NOT NULL AND supplier_id IS NULL) OR
    (pihak_tipe = 'supplier'  AND supplier_id  IS NOT NULL AND pelanggan_id IS NULL)
  )
);

CREATE INDEX ON hutang_piutang (sumber, sumber_id);
CREATE INDEX ON hutang_piutang (pelanggan_id) WHERE pelanggan_id IS NOT NULL;
CREATE INDEX ON hutang_piutang (supplier_id)  WHERE supplier_id  IS NOT NULL;
CREATE INDEX ON hutang_piutang (status);
CREATE INDEX ON hutang_piutang (tanggal DESC);

-- 5. Tabel pembayaran_hp (riwayat pelunasan)
CREATE TABLE pembayaran_hp (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  hutang_piutang_id uuid          NOT NULL REFERENCES hutang_piutang(id),
  jumlah            numeric(15,2) NOT NULL CHECK (jumlah > 0),
  tanggal           date          NOT NULL,
  catatan           text,
  dibuat_oleh       uuid          REFERENCES profiles(id),
  created_at        timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX ON pembayaran_hp (hutang_piutang_id);

-- 6. Tabel riwayat_saldo_kredit (audit trail)
CREATE TABLE riwayat_saldo_kredit (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  pihak_tipe      text          NOT NULL CHECK (pihak_tipe IN ('pelanggan', 'supplier')),
  pelanggan_id    uuid          REFERENCES pelanggan(id),
  supplier_id     uuid          REFERENCES supplier(id),
  jumlah          numeric(15,2) NOT NULL,
  saldo_sebelum   numeric(15,2) NOT NULL,
  saldo_sesudah   numeric(15,2) NOT NULL,
  keterangan      text          NOT NULL,
  sumber          text          NOT NULL CHECK (sumber IN ('penjualan', 'pembelian', 'pembayaran_hp', 'manual')),
  sumber_id       uuid,
  dibuat_oleh     uuid          REFERENCES profiles(id),
  created_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX ON riwayat_saldo_kredit (pelanggan_id) WHERE pelanggan_id IS NOT NULL;
CREATE INDEX ON riwayat_saldo_kredit (supplier_id)  WHERE supplier_id  IS NOT NULL;
CREATE INDEX ON riwayat_saldo_kredit (created_at DESC);

-- 7. RLS
ALTER TABLE hutang_piutang       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pembayaran_hp        ENABLE ROW LEVEL SECURITY;
ALTER TABLE riwayat_saldo_kredit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hp_select" ON hutang_piutang FOR SELECT TO authenticated
  USING (
    get_user_role() = 'admin' OR
    (get_user_role() = 'pegawai' AND tipe = 'piutang' AND sumber = 'penjualan')
  );
CREATE POLICY "hp_insert" ON hutang_piutang FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "hp_update" ON hutang_piutang FOR UPDATE TO authenticated
  USING  (get_user_role() = 'admin' AND deleted_at IS NULL)
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "phb_select" ON pembayaran_hp FOR SELECT TO authenticated
  USING (get_user_role() = 'admin');
CREATE POLICY "phb_insert" ON pembayaran_hp FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "rsk_select" ON riwayat_saldo_kredit FOR SELECT TO authenticated
  USING (get_user_role() = 'admin');
CREATE POLICY "rsk_insert" ON riwayat_saldo_kredit FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');
