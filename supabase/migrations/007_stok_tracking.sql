-- ============================================================
-- MIGRATION 007: Stok Tracking pada Tabel Produk
-- ============================================================

-- Tambah kolom stok ke produk
ALTER TABLE produk ADD COLUMN IF NOT EXISTS stok numeric(10,2) NOT NULL DEFAULT 0;

-- ── Trigger: pembelian_item INSERT/DELETE ─────────────────────────────────────
-- Saat item pembelian ditambah/hapus, update stok produk
-- Hanya jika parent pembelian TIDAK soft-deleted

CREATE OR REPLACE FUNCTION fn_stok_dari_pembelian_item()
RETURNS TRIGGER AS $$
DECLARE
  parent_deleted boolean;
BEGIN
  SELECT (deleted_at IS NOT NULL) INTO parent_deleted
  FROM pembelian
  WHERE id = COALESCE(NEW.pembelian_id, OLD.pembelian_id);

  IF NOT COALESCE(parent_deleted, false) THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE produk SET stok = stok + NEW.qty WHERE id = NEW.produk_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE produk SET stok = stok - OLD.qty WHERE id = OLD.produk_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stok_pembelian_item ON pembelian_item;
CREATE TRIGGER trg_stok_pembelian_item
  AFTER INSERT OR DELETE ON pembelian_item
  FOR EACH ROW EXECUTE FUNCTION fn_stok_dari_pembelian_item();

-- ── Trigger: penjualan_item INSERT/DELETE ─────────────────────────────────────
-- Saat item penjualan ditambah: validasi stok lalu kurangi
-- Saat item penjualan dihapus: kembalikan stok

CREATE OR REPLACE FUNCTION fn_stok_dari_penjualan_item()
RETURNS TRIGGER AS $$
DECLARE
  parent_deleted boolean;
  current_stok   numeric(10,2);
  produk_nama    text;
  produk_satuan  text;
BEGIN
  SELECT (deleted_at IS NOT NULL) INTO parent_deleted
  FROM penjualan
  WHERE id = COALESCE(NEW.penjualan_id, OLD.penjualan_id);

  IF NOT COALESCE(parent_deleted, false) THEN
    IF TG_OP = 'INSERT' THEN
      SELECT stok, nama, satuan INTO current_stok, produk_nama, produk_satuan
      FROM produk WHERE id = NEW.produk_id;

      IF current_stok < NEW.qty THEN
        RAISE EXCEPTION 'Stok % tidak cukup (tersedia: % %, dibutuhkan: %)',
          produk_nama, current_stok, produk_satuan, NEW.qty;
      END IF;

      UPDATE produk SET stok = stok - NEW.qty WHERE id = NEW.produk_id;

    ELSIF TG_OP = 'DELETE' THEN
      UPDATE produk SET stok = stok + OLD.qty WHERE id = OLD.produk_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stok_penjualan_item ON penjualan_item;
CREATE TRIGGER trg_stok_penjualan_item
  AFTER INSERT OR DELETE ON penjualan_item
  FOR EACH ROW EXECUTE FUNCTION fn_stok_dari_penjualan_item();

-- ── Trigger: pembelian soft-delete/restore ────────────────────────────────────
-- Saat pembelian di-soft-delete: kurangi stok (batalkan pembelian)
-- Saat pembelian di-restore: tambah kembali

CREATE OR REPLACE FUNCTION fn_stok_soft_delete_pembelian()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    UPDATE produk p
    SET stok = p.stok - pi.qty
    FROM pembelian_item pi
    WHERE pi.pembelian_id = NEW.id AND pi.produk_id = p.id;
  END IF;

  IF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
    UPDATE produk p
    SET stok = p.stok + pi.qty
    FROM pembelian_item pi
    WHERE pi.pembelian_id = NEW.id AND pi.produk_id = p.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stok_pembelian_soft_delete ON pembelian;
CREATE TRIGGER trg_stok_pembelian_soft_delete
  AFTER UPDATE OF deleted_at ON pembelian
  FOR EACH ROW EXECUTE FUNCTION fn_stok_soft_delete_pembelian();

-- ── Trigger: penjualan soft-delete/restore ────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_stok_soft_delete_penjualan()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    UPDATE produk p
    SET stok = p.stok + pji.qty
    FROM penjualan_item pji
    WHERE pji.penjualan_id = NEW.id AND pji.produk_id = p.id;
  END IF;

  IF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
    UPDATE produk p
    SET stok = p.stok - pji.qty
    FROM penjualan_item pji
    WHERE pji.penjualan_id = NEW.id AND pji.produk_id = p.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stok_penjualan_soft_delete ON penjualan;
CREATE TRIGGER trg_stok_penjualan_soft_delete
  AFTER UPDATE OF deleted_at ON penjualan
  FOR EACH ROW EXECUTE FUNCTION fn_stok_soft_delete_penjualan();

-- ── Hitung ulang stok dari data existing ─────────────────────────────────────

UPDATE produk p
SET stok = COALESCE((
  SELECT SUM(pi.qty)
  FROM pembelian_item pi
  JOIN pembelian pm ON pm.id = pi.pembelian_id
  WHERE pi.produk_id = p.id AND pm.deleted_at IS NULL
), 0) - COALESCE((
  SELECT SUM(pji.qty)
  FROM penjualan_item pji
  JOIN penjualan pj ON pj.id = pji.penjualan_id
  WHERE pji.produk_id = p.id AND pj.deleted_at IS NULL
), 0);
