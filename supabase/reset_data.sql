-- ============================================================
-- RESET DATA: Hapus semua data dummy, siap pakai nyata
-- ============================================================
-- ⚠️  PERINGATAN: Script ini menghapus SEMUA data transaksi,
--     master data, dan riwayat aktivitas secara PERMANEN.
--     Jalankan HANYA saat yakin ingin mulai dari awal.
--
-- Yang TIDAK dihapus:
--   - Akun user / profiles (admin tetap bisa login)
--
-- Cara pakai:
--   Buka Supabase Dashboard → SQL Editor → paste & Run
-- ============================================================

BEGIN;

-- ── 1. Riwayat & log (tidak ada dependensi ke bawah) ────────
TRUNCATE TABLE audit_log               RESTART IDENTITY CASCADE;
TRUNCATE TABLE riwayat_saldo_kredit    RESTART IDENTITY CASCADE;

-- ── 2. Pembayaran hutang-piutang ─────────────────────────────
TRUNCATE TABLE pembayaran_hp           RESTART IDENTITY CASCADE;
TRUNCATE TABLE hutang_piutang          RESTART IDENTITY CASCADE;

-- ── 3. Purchase Order ────────────────────────────────────────
TRUNCATE TABLE purchase_order_item     RESTART IDENTITY CASCADE;
TRUNCATE TABLE purchase_order          RESTART IDENTITY CASCADE;

-- ── 4. HR ────────────────────────────────────────────────────
TRUNCATE TABLE absensi                 RESTART IDENTITY CASCADE;
TRUNCATE TABLE penggajian              RESTART IDENTITY CASCADE;

-- ── 5. Transaksi penjualan & pembelian ───────────────────────
TRUNCATE TABLE penjualan_item          RESTART IDENTITY CASCADE;
TRUNCATE TABLE penjualan               RESTART IDENTITY CASCADE;
TRUNCATE TABLE pembelian_item          RESTART IDENTITY CASCADE;
TRUNCATE TABLE pembelian               RESTART IDENTITY CASCADE;

-- ── 6. Master data ───────────────────────────────────────────
TRUNCATE TABLE produk                  RESTART IDENTITY CASCADE;
TRUNCATE TABLE kategori_produk         RESTART IDENTITY CASCADE;
TRUNCATE TABLE pelanggan               RESTART IDENTITY CASCADE;
TRUNCATE TABLE supplier                RESTART IDENTITY CASCADE;
TRUNCATE TABLE karyawan                RESTART IDENTITY CASCADE;

-- ── 7. Reset sequence nomor PO ke 1 ─────────────────────────
ALTER SEQUENCE po_nomor_seq RESTART WITH 1;

COMMIT;

-- Verifikasi: semua tabel harus menunjukkan 0 baris
SELECT 'audit_log'            AS tabel, COUNT(*) AS baris FROM audit_log
UNION ALL
SELECT 'hutang_piutang',                 COUNT(*) FROM hutang_piutang
UNION ALL
SELECT 'purchase_order',                 COUNT(*) FROM purchase_order
UNION ALL
SELECT 'penjualan',                      COUNT(*) FROM penjualan
UNION ALL
SELECT 'pembelian',                      COUNT(*) FROM pembelian
UNION ALL
SELECT 'produk',                         COUNT(*) FROM produk
UNION ALL
SELECT 'pelanggan',                      COUNT(*) FROM pelanggan
UNION ALL
SELECT 'supplier',                       COUNT(*) FROM supplier
UNION ALL
SELECT 'karyawan',                       COUNT(*) FROM karyawan
UNION ALL
SELECT 'absensi',                        COUNT(*) FROM absensi
ORDER BY tabel;
