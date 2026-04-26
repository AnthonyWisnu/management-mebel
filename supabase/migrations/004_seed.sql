-- ============================================================
-- MIGRATION 004: Seed Data Awal
-- ============================================================
-- CATATAN PENTING:
-- File ini TIDAK dapat dijalankan langsung via SQL editor karena
-- INSERT ke auth.users membutuhkan Supabase Auth Admin API.
--
-- Cara membuat admin pertama:
-- 1. Buka Supabase Dashboard > Authentication > Users
-- 2. Klik "Add user" > "Create new user"
-- 3. Isi email: admin@mebel.com, password: Admin123!
-- 4. Setelah user dibuat, trigger handle_new_user akan otomatis
--    insert ke tabel profiles dengan role 'pegawai'
-- 5. Update role ke 'admin' via SQL berikut:
--
--    UPDATE profiles
--    SET role = 'admin', nama = 'Administrator'
--    WHERE id = (
--      SELECT id FROM auth.users WHERE email = 'admin@mebel.com'
--    );
--
-- ============================================================
-- SCRIPT UPDATE ROLE ADMIN (jalankan setelah buat user di dashboard):
-- ============================================================

-- UPDATE profiles
-- SET role = 'admin', nama = 'Administrator'
-- WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'admin@mebel.com'
-- );

-- ============================================================
-- DATA SAMPLE (opsional, untuk testing):
-- ============================================================

-- Kategori Produk
INSERT INTO kategori_produk (nama, deskripsi) VALUES
  ('Kursi', 'Berbagai jenis kursi kayu'),
  ('Meja', 'Meja ruang tamu, meja makan, meja kerja'),
  ('Lemari', 'Lemari pakaian dan lemari hias'),
  ('Tempat Tidur', 'Ranjang dan dipan'),
  ('Rak', 'Rak buku dan rak display')
ON CONFLICT (nama) DO NOTHING;
