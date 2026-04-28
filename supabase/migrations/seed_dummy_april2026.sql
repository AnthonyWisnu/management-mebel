-- ============================================================
-- DUMMY DATA: Toko Mebel April 2026
-- Jalankan di Supabase Dashboard > SQL Editor
--
-- Prasyarat: semua migration 001-010 sudah dijalankan
-- ============================================================
--
-- STOK AKHIR BULAN APRIL (setelah semua transaksi):
--   Kursi Makan Kayu Jati:  18 masuk - 14 keluar =  4 sisa
--   Kursi Kantor Putar:     10 masuk -  9 keluar =  1 sisa
--   Meja Makan 4 Orang:      6 masuk -  5 keluar =  1 sisa
--   Meja Kerja Minimalis:    4 masuk -  4 keluar =  0 sisa
--   Lemari Pakaian 3 Pintu:  4 masuk -  3 keluar =  1 sisa
--   Sofa 3 Dudukan:          5 masuk -  4 keluar =  1 sisa
--
-- STATUS PEMBAYARAN:
--   PB-APR-001 (Kayu Nusantara)     : Lunas
--   PB-APR-002 (CV Besi Jaya)       : Lunas
--   PB-APR-003 (Toko Bahan Mebel)   : Sebagian -- sisa hutang Rp 5.400.000
--   PB-APR-004 (Kayu Nusantara)     : Belum Bayar -- hutang Rp 4.500.000
--
--   PJ-APR-001 (Budi Santoso)       : Lunas
--   PJ-APR-002 (Furniture Makmur)   : Sebagian -- piutang Rp 1.250.000 (sudah ada cicilan Rp 1.000.000)
--   PJ-APR-003 (Dewi Rahayu)        : Lunas
--   PJ-APR-004 (CV Interior Modern) : Belum Bayar -- piutang Rp 7.500.000
--   PJ-APR-005 (Budi Santoso)       : Lunas
--   PJ-APR-006 (Furniture Makmur)   : Lunas
--   PJ-APR-007 (Dewi Rahayu)        : Sebagian -- piutang Rp 2.200.000
--   PJ-APR-008 (CV Interior Modern) : Lunas
-- ============================================================

BEGIN;

-- ============================================================
-- STEP 1: CLEANUP (hapus semua kecuali profiles/users)
-- ============================================================
DELETE FROM pembayaran_hp;
DELETE FROM riwayat_saldo_kredit;
DELETE FROM hutang_piutang;
DELETE FROM penggajian;
DELETE FROM absensi;
DELETE FROM penjualan;      -- CASCADE ke penjualan_item
DELETE FROM pembelian;      -- CASCADE ke pembelian_item
DELETE FROM produk;
DELETE FROM kategori_produk;
DELETE FROM karyawan;
DELETE FROM pelanggan;
DELETE FROM supplier;

-- ============================================================
-- STEP 2: MASTER DATA
-- ============================================================

INSERT INTO supplier (id, nama, alamat, no_telp, email, catatan, saldo_kredit) VALUES
('11100000-0000-0000-0000-000000000001', 'PT Kayu Nusantara',          'Jl. Industri No. 45, Semarang',     '024-7654321', 'kayu@nusantara.co.id', 'Supplier utama kayu jati dan mahoni',           0),
('11100000-0000-0000-0000-000000000002', 'CV Besi Jaya',               'Jl. Raya Solo No. 12, Surakarta',   '0271-456789', null,                   'Supplier rangka besi dan baut',                 0),
('11100000-0000-0000-0000-000000000003', 'Toko Bahan Mebel Sejahtera', 'Jl. Pasar Lama No. 8, Yogyakarta',  '0274-321654', 'sejahtera@gmail.com',  'Supplier bahan finishing dan pelengkap',         0),
('11100000-0000-0000-0000-000000000004', 'UD Foam Berkah',             'Jl. Mawar No. 22, Klaten',          '0272-789012', null,                   'Supplier busa sofa dan kursi',                  0);

INSERT INTO pelanggan (id, nama, alamat, no_telp, email, catatan, saldo_kredit) VALUES
('22200000-0000-0000-0000-000000000001', 'Budi Santoso',         'Jl. Anggrek No. 5, Semarang',    '081234567890', 'budi.santoso@gmail.com',    'Pelanggan tetap, beli untuk keperluan rumah', 0),
('22200000-0000-0000-0000-000000000002', 'Toko Furniture Makmur','Jl. Pemuda No. 100, Surabaya',   '031-8765432',  'makmur.furniture@gmail.com','Reseller mebel wilayah Surabaya',             0),
('22200000-0000-0000-0000-000000000003', 'Dewi Rahayu',          'Jl. Melati No. 17, Yogyakarta',  '082345678901', null,                        'Interior designer freelance',                 0),
('22200000-0000-0000-0000-000000000004', 'CV Interior Modern',   'Jl. Sudirman No. 55, Jakarta',   '021-5432100',  'interior.modern@cv.id',     'Kontraktor interior gedung perkantoran',       0);

INSERT INTO karyawan (id, nama, alamat, no_telp, jabatan, gaji_setengah_hari, gaji_satu_hari, tanggal_bergabung, aktif) VALUES
('33300000-0000-0000-0000-000000000001', 'Ahmad Fajar',    'Jl. Kenanga No. 3, Semarang', '085678901234', 'Tukang Kayu Senior', 75000,  150000, '2023-03-01', true),
('33300000-0000-0000-0000-000000000002', 'Sari Wulandari', 'Jl. Dahlia No. 9, Semarang',  '087890123456', 'Admin & Kasir',       60000,  120000, '2024-01-15', true),
('33300000-0000-0000-0000-000000000003', 'Budi Hartono',   'Jl. Mawar No. 11, Semarang',  '089012345678', 'Tukang Finishing',    80000,  160000, '2022-07-01', true);

INSERT INTO kategori_produk (id, nama, deskripsi) VALUES
('44400000-0000-0000-0000-000000000001', 'Kursi',  'Semua jenis kursi kayu, besi, dan kombinasi'),
('44400000-0000-0000-0000-000000000002', 'Meja',   'Meja makan, meja kerja, dan meja tamu'),
('44400000-0000-0000-0000-000000000003', 'Lemari', 'Lemari pakaian, lemari hias, dan rak'),
('44400000-0000-0000-0000-000000000004', 'Sofa',   'Sofa tamu, sofa bed, dan kursi santai');

INSERT INTO produk (id, kategori_id, nama, deskripsi, satuan) VALUES
('55500000-0000-0000-0000-000000000001', '44400000-0000-0000-0000-000000000001', 'Kursi Makan Kayu Jati',  'Kursi makan solid kayu jati finishing natural, kokoh dan tahan lama',  'pcs'),
('55500000-0000-0000-0000-000000000002', '44400000-0000-0000-0000-000000000001', 'Kursi Kantor Putar',     'Kursi kantor ergonomis rangka besi dan busa tebal',                    'pcs'),
('55500000-0000-0000-0000-000000000003', '44400000-0000-0000-0000-000000000002', 'Meja Makan 4 Orang',     'Meja makan kayu jati 120x80 cm untuk 4 orang',                        'unit'),
('55500000-0000-0000-0000-000000000004', '44400000-0000-0000-0000-000000000002', 'Meja Kerja Minimalis',   'Meja kerja kayu kombinasi besi dengan 2 laci, cocok home office',      'unit'),
('55500000-0000-0000-0000-000000000005', '44400000-0000-0000-0000-000000000003', 'Lemari Pakaian 3 Pintu', 'Lemari pakaian 3 pintu dengan cermin, kayu sonokeling',               'unit'),
('55500000-0000-0000-0000-000000000006', '44400000-0000-0000-0000-000000000004', 'Sofa 3 Dudukan',         'Sofa tamu 3 dudukan busa tebal kain beludru premium',                  'set');

-- ============================================================
-- STEP 3: PEMBELIAN
-- Stok masuk per produk:
--   P1 Kursi Makan:  PB-001(10) + PB-004(8)  = 18
--   P2 Kursi Kantor: PB-002(10)               = 10
--   P3 Meja Makan:   PB-003(6)                =  6
--   P4 Meja Kerja:   PB-002(4)                =  4
--   P5 Lemari:       PB-003(4)                =  4
--   P6 Sofa:         PB-001(3) + PB-004(2)   =  5
-- ============================================================

INSERT INTO pembelian (id, no_faktur, tanggal, supplier_id, total, total_dibayar, status_bayar, catatan, dibuat_oleh) VALUES
('66600000-0000-0000-0000-000000000001', 'PB-APR-001', '2026-04-03', '11100000-0000-0000-0000-000000000001',  5900000,  5900000, 'lunas',       'Stok awal bulan April',              (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('66600000-0000-0000-0000-000000000002', 'PB-APR-002', '2026-04-10', '11100000-0000-0000-0000-000000000002',  6400000,  6400000, 'lunas',       'Restok kursi kantor dan meja kerja', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('66600000-0000-0000-0000-000000000003', 'PB-APR-003', '2026-04-17', '11100000-0000-0000-0000-000000000003', 11400000,  6000000, 'sebagian',    'Pembelian lemari dan meja makan',    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('66600000-0000-0000-0000-000000000004', 'PB-APR-004', '2026-04-24', '11100000-0000-0000-0000-000000000001',  4500000,        0, 'belum_lunas', 'Restok akhir bulan April',           (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1));

INSERT INTO pembelian_item (pembelian_id, produk_id, qty, harga_beli_satuan, subtotal) VALUES
-- PB-APR-001: 10 Kursi Makan + 3 Sofa
('66600000-0000-0000-0000-000000000001', '55500000-0000-0000-0000-000000000001', 10, 350000, 3500000),
('66600000-0000-0000-0000-000000000001', '55500000-0000-0000-0000-000000000006',  3, 800000, 2400000),
-- PB-APR-002: 10 Kursi Kantor + 4 Meja Kerja
('66600000-0000-0000-0000-000000000002', '55500000-0000-0000-0000-000000000002', 10, 400000, 4000000),
('66600000-0000-0000-0000-000000000002', '55500000-0000-0000-0000-000000000004',  4, 600000, 2400000),
-- PB-APR-003: 4 Lemari + 6 Meja Makan
('66600000-0000-0000-0000-000000000003', '55500000-0000-0000-0000-000000000005',  4, 1500000, 6000000),
('66600000-0000-0000-0000-000000000003', '55500000-0000-0000-0000-000000000003',  6,  900000, 5400000),
-- PB-APR-004: 8 Kursi Makan + 2 Sofa
('66600000-0000-0000-0000-000000000004', '55500000-0000-0000-0000-000000000001',  8, 350000, 2800000),
('66600000-0000-0000-0000-000000000004', '55500000-0000-0000-0000-000000000006',  2, 850000, 1700000);

-- ============================================================
-- STEP 4: PENJUALAN (2 per minggu)
--
-- Stok saat trigger berjalan (pembelian sudah masuk lebih dulu):
--   P1 Kursi Makan (18): -4 -6 -4 = sisa 4
--   P2 Kursi Kantor (10): -3 -2 -4 = sisa 1
--   P3 Meja Makan (6): -1 -2 -2 = sisa 1
--   P4 Meja Kerja (4): -1 -3 = sisa 0
--   P5 Lemari (4): -1 -2 = sisa 1
--   P6 Sofa (5): -2 -1 -1 = sisa 1
-- ============================================================

INSERT INTO penjualan (id, no_faktur, tanggal, pelanggan_id, total_penjualan, total_hpp, total_dibayar, status_bayar, catatan, dibuat_oleh) VALUES
('77700000-0000-0000-0000-000000000001', 'PJ-APR-001', '2026-04-02', '22200000-0000-0000-0000-000000000001', 4400000, 2300000, 4400000, 'lunas',       null,                                   (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('77700000-0000-0000-0000-000000000002', 'PJ-APR-002', '2026-04-07', '22200000-0000-0000-0000-000000000002', 5250000, 2800000, 3000000, 'sebagian',    'Pengiriman ke Surabaya',               (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('77700000-0000-0000-0000-000000000003', 'PJ-APR-003', '2026-04-09', '22200000-0000-0000-0000-000000000003', 4000000, 2100000, 4000000, 'lunas',       null,                                   (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('77700000-0000-0000-0000-000000000004', 'PJ-APR-004', '2026-04-14', '22200000-0000-0000-0000-000000000004', 7500000, 3900000,       0, 'belum_lunas', 'Order besar untuk kantor',             (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('77700000-0000-0000-0000-000000000005', 'PJ-APR-005', '2026-04-16', '22200000-0000-0000-0000-000000000001', 3100000, 1650000, 3100000, 'lunas',       null,                                   (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('77700000-0000-0000-0000-000000000006', 'PJ-APR-006', '2026-04-21', '22200000-0000-0000-0000-000000000002', 9200000, 4800000, 9200000, 'lunas',       'Order rutin bulanan Furniture Makmur', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('77700000-0000-0000-0000-000000000007', 'PJ-APR-007', '2026-04-23', '22200000-0000-0000-0000-000000000003', 4200000, 2250000, 2000000, 'sebagian',    null,                                   (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('77700000-0000-0000-0000-000000000008', 'PJ-APR-008', '2026-04-28', '22200000-0000-0000-0000-000000000004', 6600000, 3400000, 6600000, 'lunas',       'Pelunasan order gedung Sudirman',      (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1));

INSERT INTO penjualan_item (penjualan_id, produk_id, qty, harga_jual_satuan, hpp_satuan, subtotal_jual, subtotal_hpp) VALUES
-- PJ-APR-001 Budi Santoso: 4 Kursi Makan + 1 Meja Makan
('77700000-0000-0000-0000-000000000001', '55500000-0000-0000-0000-000000000001', 4,  650000, 350000, 2600000, 1400000),
('77700000-0000-0000-0000-000000000001', '55500000-0000-0000-0000-000000000003', 1, 1800000, 900000, 1800000,  900000),
-- PJ-APR-002 Toko Furniture Makmur: 2 Sofa + 3 Kursi Kantor
('77700000-0000-0000-0000-000000000002', '55500000-0000-0000-0000-000000000006', 2, 1500000, 800000, 3000000, 1600000),
('77700000-0000-0000-0000-000000000002', '55500000-0000-0000-0000-000000000002', 3,  750000, 400000, 2250000, 1200000),
-- PJ-APR-003 Dewi Rahayu: 1 Lemari + 1 Meja Kerja
('77700000-0000-0000-0000-000000000003', '55500000-0000-0000-0000-000000000005', 1, 2800000, 1500000, 2800000, 1500000),
('77700000-0000-0000-0000-000000000003', '55500000-0000-0000-0000-000000000004', 1, 1200000,  600000, 1200000,  600000),
-- PJ-APR-004 CV Interior Modern: 6 Kursi Makan + 2 Meja Makan
('77700000-0000-0000-0000-000000000004', '55500000-0000-0000-0000-000000000001', 6,  650000, 350000, 3900000, 2100000),
('77700000-0000-0000-0000-000000000004', '55500000-0000-0000-0000-000000000003', 2, 1800000, 900000, 3600000, 1800000),
-- PJ-APR-005 Budi Santoso: 1 Sofa + 2 Kursi Kantor
('77700000-0000-0000-0000-000000000005', '55500000-0000-0000-0000-000000000006', 1, 1600000, 850000, 1600000,  850000),
('77700000-0000-0000-0000-000000000005', '55500000-0000-0000-0000-000000000002', 2,  750000, 400000, 1500000,  800000),
-- PJ-APR-006 Toko Furniture Makmur: 2 Lemari + 3 Meja Kerja
('77700000-0000-0000-0000-000000000006', '55500000-0000-0000-0000-000000000005', 2, 2800000, 1500000, 5600000, 3000000),
('77700000-0000-0000-0000-000000000006', '55500000-0000-0000-0000-000000000004', 3, 1200000,  600000, 3600000, 1800000),
-- PJ-APR-007 Dewi Rahayu: 4 Kursi Makan + 1 Sofa
('77700000-0000-0000-0000-000000000007', '55500000-0000-0000-0000-000000000001', 4,  650000, 350000, 2600000, 1400000),
('77700000-0000-0000-0000-000000000007', '55500000-0000-0000-0000-000000000006', 1, 1600000, 850000, 1600000,  850000),
-- PJ-APR-008 CV Interior Modern: 2 Meja Makan + 4 Kursi Kantor
('77700000-0000-0000-0000-000000000008', '55500000-0000-0000-0000-000000000003', 2, 1800000, 900000, 3600000, 1800000),
('77700000-0000-0000-0000-000000000008', '55500000-0000-0000-0000-000000000002', 4,  750000, 400000, 3000000, 1600000);

-- ============================================================
-- STEP 5: HUTANG PIUTANG
--
-- Catatan: Dalam kondisi normal, record ini terbentuk otomatis
-- melalui server action syncHPCreate saat transaksi disimpan.
-- Untuk keperluan seed, dibuat manual agar konsisten.
--
-- HUTANG (dari pembelian):
--   PB-APR-003: total=11.400.000, dibayar=6.000.000 -> hutang=5.400.000 ke Toko Bahan Mebel Sejahtera
--   PB-APR-004: total=4.500.000,  dibayar=0         -> hutang=4.500.000 ke PT Kayu Nusantara
--
-- PIUTANG (dari penjualan):
--   PJ-APR-002: total=5.250.000, dibayar=3.000.000 -> piutang=2.250.000 dari Furniture Makmur
--               + sudah ada cicilan Rp1.000.000 via pembayaran_hp -> sisa piutang=1.250.000
--   PJ-APR-004: total=7.500.000, dibayar=0         -> piutang=7.500.000 dari CV Interior Modern
--   PJ-APR-007: total=4.200.000, dibayar=2.000.000 -> piutang=2.200.000 dari Dewi Rahayu
-- ============================================================

INSERT INTO hutang_piutang (id, tipe, sumber, sumber_id, pihak_tipe, supplier_id, pelanggan_id, nominal, saldo_terpakai, terbayar, status, tanggal, catatan, dibuat_oleh) VALUES
-- Hutang PB-APR-003 ke Toko Bahan Mebel Sejahtera
('88800000-0000-0000-0000-000000000001',
 'hutang', 'pembelian', '66600000-0000-0000-0000-000000000003',
 'supplier', '11100000-0000-0000-0000-000000000003', null,
 5400000, 0, 0, 'sebagian',
 '2026-04-17', 'Cicilan pertama sudah dibayar Rp 6.000.000',
 (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),

-- Hutang PB-APR-004 ke PT Kayu Nusantara
('88800000-0000-0000-0000-000000000002',
 'hutang', 'pembelian', '66600000-0000-0000-0000-000000000004',
 'supplier', '11100000-0000-0000-0000-000000000001', null,
 4500000, 0, 0, 'belum_lunas',
 '2026-04-24', null,
 (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),

-- Piutang PJ-APR-002 dari Toko Furniture Makmur
-- nominal=2.250.000, terbayar=1.000.000 (via pembayaran_hp), sisa=1.250.000
('88800000-0000-0000-0000-000000000003',
 'piutang', 'penjualan', '77700000-0000-0000-0000-000000000002',
 'pelanggan', null, '22200000-0000-0000-0000-000000000002',
 2250000, 0, 1000000, 'sebagian',
 '2026-04-07', 'Pengiriman ke Surabaya, cicilan masuk 18 Apr',
 (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),

-- Piutang PJ-APR-004 dari CV Interior Modern
('88800000-0000-0000-0000-000000000004',
 'piutang', 'penjualan', '77700000-0000-0000-0000-000000000004',
 'pelanggan', null, '22200000-0000-0000-0000-000000000004',
 7500000, 0, 0, 'belum_lunas',
 '2026-04-14', 'Order besar untuk proyek kantor',
 (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),

-- Piutang PJ-APR-007 dari Dewi Rahayu
('88800000-0000-0000-0000-000000000005',
 'piutang', 'penjualan', '77700000-0000-0000-0000-000000000007',
 'pelanggan', null, '22200000-0000-0000-0000-000000000003',
 2200000, 0, 0, 'sebagian',
 '2026-04-23', null,
 (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1));

-- Satu contoh riwayat cicilan: PJ-APR-002 dibayar Rp 1.000.000 pada 18 Apr
INSERT INTO pembayaran_hp (hutang_piutang_id, jumlah, tanggal, catatan, dibuat_oleh) VALUES
('88800000-0000-0000-0000-000000000003',
 1000000, '2026-04-18', 'Transfer bank BCA',
 (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1));

-- ============================================================
-- STEP 6: ABSENSI
-- Hari kerja: Senin-Sabtu (Minggu libur)
-- April 1 = Rabu
-- ============================================================

INSERT INTO absensi (tanggal, karyawan_id, tipe_shift, nominal, catatan, dibuat_oleh) VALUES
-- MINGGU 1 (1-7 Apr)
-- Ahmad Fajar
('2026-04-01','33300000-0000-0000-0000-000000000001','satu_hari', 150000, null,                      (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-02','33300000-0000-0000-0000-000000000001','satu_hari', 150000, null,                      (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-03','33300000-0000-0000-0000-000000000001','satu_hari', 150000, null,                      (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-03','33300000-0000-0000-0000-000000000001','lembur',    100000, 'Lembur finishing produk', (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-04','33300000-0000-0000-0000-000000000001','satu_hari', 150000, null,                      (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-06','33300000-0000-0000-0000-000000000001','satu_hari', 150000, null,                      (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-07','33300000-0000-0000-0000-000000000001','satu_hari', 150000, null,                      (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
-- Sari Wulandari
('2026-04-01','33300000-0000-0000-0000-000000000002','satu_hari', 120000, null, (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-02','33300000-0000-0000-0000-000000000002','satu_hari', 120000, null, (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-03','33300000-0000-0000-0000-000000000002','satu_hari', 120000, null, (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-04','33300000-0000-0000-0000-000000000002','satu_hari', 120000, null, (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-06','33300000-0000-0000-0000-000000000002','satu_hari', 120000, null, (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-07','33300000-0000-0000-0000-000000000002','satu_hari', 120000, null, (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
-- Budi Hartono
('2026-04-01','33300000-0000-0000-0000-000000000003','satu_hari', 160000, null,                     (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-02','33300000-0000-0000-0000-000000000003','satu_hari', 160000, null,                     (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-03','33300000-0000-0000-0000-000000000003','satu_hari', 160000, null,                     (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-04','33300000-0000-0000-0000-000000000003','satu_hari', 160000, null,                     (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-04','33300000-0000-0000-0000-000000000003','lembur',    150000, 'Lembur assembly sofa',   (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-06','33300000-0000-0000-0000-000000000003','satu_hari', 160000, null,                     (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-07','33300000-0000-0000-0000-000000000003','satu_hari', 160000, null,                     (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),

-- MINGGU 2 (8-14 Apr)
-- Ahmad Fajar
('2026-04-08','33300000-0000-0000-0000-000000000001','satu_hari', 150000, null,                      (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-09','33300000-0000-0000-0000-000000000001','satu_hari', 150000, null,                      (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-10','33300000-0000-0000-0000-000000000001','satu_hari', 150000, null,                      (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-10','33300000-0000-0000-0000-000000000001','lembur',    100000, 'Lembur finishing produk', (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-11','33300000-0000-0000-0000-000000000001','satu_hari', 150000, null,                      (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-13','33300000-0000-0000-0000-000000000001','satu_hari', 150000, null,                      (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-14','33300000-0000-0000-0000-000000000001','satu_hari', 150000, null,                      (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
-- Sari Wulandari (setengah_hari Apr 11)
('2026-04-08','33300000-0000-0000-0000-000000000002','satu_hari',    120000, null,               (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-09','33300000-0000-0000-0000-000000000002','satu_hari',    120000, null,               (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-10','33300000-0000-0000-0000-000000000002','satu_hari',    120000, null,               (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-11','33300000-0000-0000-0000-000000000002','setengah_hari', 60000, 'Pulang lebih awal',(SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-13','33300000-0000-0000-0000-000000000002','satu_hari',    120000, null,               (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-14','33300000-0000-0000-0000-000000000002','satu_hari',    120000, null,               (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
-- Budi Hartono
('2026-04-08','33300000-0000-0000-0000-000000000003','satu_hari', 160000, null,                    (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-09','33300000-0000-0000-0000-000000000003','satu_hari', 160000, null,                    (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-10','33300000-0000-0000-0000-000000000003','satu_hari', 160000, null,                    (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-11','33300000-0000-0000-0000-000000000003','satu_hari', 160000, null,                    (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-11','33300000-0000-0000-0000-000000000003','lembur',    150000, 'Lembur assembly kursi', (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-13','33300000-0000-0000-0000-000000000003','satu_hari', 160000, null,                    (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-14','33300000-0000-0000-0000-000000000003','satu_hari', 160000, null,                    (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),

-- MINGGU 3 (15-21 Apr)
-- Ahmad Fajar
('2026-04-15','33300000-0000-0000-0000-000000000001','satu_hari', 150000, null,                      (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-16','33300000-0000-0000-0000-000000000001','satu_hari', 150000, null,                      (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-17','33300000-0000-0000-0000-000000000001','satu_hari', 150000, null,                      (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-17','33300000-0000-0000-0000-000000000001','lembur',    100000, 'Lembur finishing produk', (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-18','33300000-0000-0000-0000-000000000001','satu_hari', 150000, null,                      (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-20','33300000-0000-0000-0000-000000000001','satu_hari', 150000, null,                      (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-21','33300000-0000-0000-0000-000000000001','satu_hari', 150000, null,                      (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
-- Sari Wulandari
('2026-04-15','33300000-0000-0000-0000-000000000002','satu_hari', 120000, null, (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-16','33300000-0000-0000-0000-000000000002','satu_hari', 120000, null, (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-17','33300000-0000-0000-0000-000000000002','satu_hari', 120000, null, (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-18','33300000-0000-0000-0000-000000000002','satu_hari', 120000, null, (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-20','33300000-0000-0000-0000-000000000002','satu_hari', 120000, null, (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-21','33300000-0000-0000-0000-000000000002','satu_hari', 120000, null, (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
-- Budi Hartono
('2026-04-15','33300000-0000-0000-0000-000000000003','satu_hari', 160000, null,                    (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-16','33300000-0000-0000-0000-000000000003','satu_hari', 160000, null,                    (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-17','33300000-0000-0000-0000-000000000003','satu_hari', 160000, null,                    (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-18','33300000-0000-0000-0000-000000000003','satu_hari', 160000, null,                    (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-18','33300000-0000-0000-0000-000000000003','lembur',    150000, 'Lembur assembly lemari',(SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-20','33300000-0000-0000-0000-000000000003','satu_hari', 160000, null,                    (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-21','33300000-0000-0000-0000-000000000003','satu_hari', 160000, null,                    (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),

-- MINGGU 4 (22-28 Apr)
-- Ahmad Fajar
('2026-04-22','33300000-0000-0000-0000-000000000001','satu_hari', 150000, null,                      (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-23','33300000-0000-0000-0000-000000000001','satu_hari', 150000, null,                      (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-24','33300000-0000-0000-0000-000000000001','satu_hari', 150000, null,                      (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-24','33300000-0000-0000-0000-000000000001','lembur',    100000, 'Lembur finishing produk', (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-25','33300000-0000-0000-0000-000000000001','satu_hari', 150000, null,                      (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-27','33300000-0000-0000-0000-000000000001','satu_hari', 150000, null,                      (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-28','33300000-0000-0000-0000-000000000001','satu_hari', 150000, null,                      (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
-- Sari Wulandari (setengah_hari Apr 25)
('2026-04-22','33300000-0000-0000-0000-000000000002','satu_hari',    120000, null,               (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-23','33300000-0000-0000-0000-000000000002','satu_hari',    120000, null,               (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-24','33300000-0000-0000-0000-000000000002','satu_hari',    120000, null,               (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-25','33300000-0000-0000-0000-000000000002','setengah_hari', 60000, 'Pulang lebih awal',(SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-27','33300000-0000-0000-0000-000000000002','satu_hari',    120000, null,               (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-28','33300000-0000-0000-0000-000000000002','satu_hari',    120000, null,               (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
-- Budi Hartono
('2026-04-22','33300000-0000-0000-0000-000000000003','satu_hari', 160000, null,                  (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-23','33300000-0000-0000-0000-000000000003','satu_hari', 160000, null,                  (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-24','33300000-0000-0000-0000-000000000003','satu_hari', 160000, null,                  (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-25','33300000-0000-0000-0000-000000000003','satu_hari', 160000, null,                  (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-25','33300000-0000-0000-0000-000000000003','lembur',    150000, 'Lembur assembly sofa',(SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-27','33300000-0000-0000-0000-000000000003','satu_hari', 160000, null,                  (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('2026-04-28','33300000-0000-0000-0000-000000000003','satu_hari', 160000, null,                  (SELECT id FROM profiles WHERE role='admin' LIMIT 1));

-- ============================================================
-- STEP 7: PENGGAJIAN (4 minggu x 3 karyawan = 12 record)
--
-- Ahmad Fajar:    6 x 150.000 + 100.000 lembur = 1.000.000/minggu
-- Sari Wulandari: 6 x 120.000                  =   720.000 (minggu normal)
--                 5 x 120.000 + 60.000          =   660.000 (minggu ada setengah_hari)
-- Budi Hartono:   6 x 160.000 + 150.000 lembur = 1.110.000/minggu
-- Minggu 1,2,3: status=dibayar | Minggu 4: status=draft
-- ============================================================

INSERT INTO penggajian (karyawan_id, periode_mulai, periode_selesai, total_gaji_kalkulasi, total_dibayar, status, tanggal_bayar, catatan, dibuat_oleh) VALUES
-- Minggu 1 (dibayar 8 Apr)
('33300000-0000-0000-0000-000000000001','2026-04-01','2026-04-07', 1000000, 1000000, 'dibayar', '2026-04-08', null, (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('33300000-0000-0000-0000-000000000002','2026-04-01','2026-04-07',  720000,  720000, 'dibayar', '2026-04-08', null, (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('33300000-0000-0000-0000-000000000003','2026-04-01','2026-04-07', 1110000, 1110000, 'dibayar', '2026-04-08', null, (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
-- Minggu 2 (dibayar 15 Apr, Sari setengah_hari Apr 11)
('33300000-0000-0000-0000-000000000001','2026-04-08','2026-04-14', 1000000, 1000000, 'dibayar', '2026-04-15', null, (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('33300000-0000-0000-0000-000000000002','2026-04-08','2026-04-14',  660000,  660000, 'dibayar', '2026-04-15', null, (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('33300000-0000-0000-0000-000000000003','2026-04-08','2026-04-14', 1110000, 1110000, 'dibayar', '2026-04-15', null, (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
-- Minggu 3 (dibayar 22 Apr)
('33300000-0000-0000-0000-000000000001','2026-04-15','2026-04-21', 1000000, 1000000, 'dibayar', '2026-04-22', null, (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('33300000-0000-0000-0000-000000000002','2026-04-15','2026-04-21',  720000,  720000, 'dibayar', '2026-04-22', null, (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('33300000-0000-0000-0000-000000000003','2026-04-15','2026-04-21', 1110000, 1110000, 'dibayar', '2026-04-22', null, (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
-- Minggu 4 (draft, belum dibayar, Sari setengah_hari Apr 25)
('33300000-0000-0000-0000-000000000001','2026-04-22','2026-04-28', 1000000, 1000000, 'draft', null, null, (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('33300000-0000-0000-0000-000000000002','2026-04-22','2026-04-28',  660000,  660000, 'draft', null, null, (SELECT id FROM profiles WHERE role='admin' LIMIT 1)),
('33300000-0000-0000-0000-000000000003','2026-04-22','2026-04-28', 1110000, 1110000, 'draft', null, null, (SELECT id FROM profiles WHERE role='admin' LIMIT 1));

COMMIT;
