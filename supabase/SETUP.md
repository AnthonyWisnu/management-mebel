# Panduan Setup Supabase

## Langkah 1: Buat Project Supabase

1. Buka [supabase.com](https://supabase.com) dan login
2. Klik **New Project**
3. Isi nama project: `sistem-manajemen-mebel`
4. Pilih region terdekat (misal: Southeast Asia)
5. Buat password database yang kuat, simpan di tempat aman
6. Tunggu project selesai dibuat (~2 menit)

## Langkah 2: Ambil API Keys
1. Buka **Settings > API**
2. Salin nilai berikut ke file `.env.local`:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

## Langkah 3: Jalankan Migrasi SQL

Buka **SQL Editor** di Supabase Dashboard, lalu jalankan file-file berikut **secara berurutan**:

### 3a. Schema (001_schema.sql)
Salin seluruh isi `supabase/migrations/001_schema.sql` dan jalankan.
Hasil: semua tabel, index, trigger, dan function terbuat.

### 3b. RLS Policies (002_rls.sql)
Salin seluruh isi `supabase/migrations/002_rls.sql` dan jalankan.
Hasil: RLS aktif dan semua policy terpasang.

### 3c. Storage (003_storage.sql)
Salin seluruh isi `supabase/migrations/003_storage.sql` dan jalankan.
Hasil: bucket `produk-foto` terbuat.

### 3d. Seed Data (004_seed.sql)
Salin bagian INSERT kategori_produk dari `supabase/migrations/004_seed.sql` dan jalankan.
Hasil: 5 kategori produk sample.

## Langkah 4: Buat User Admin Pertama

1. Buka **Authentication > Users**
2. Klik **Add user > Create new user**
3. Isi:
   - Email: `admin@mebel.com`
   - Password: `Admin123!`
   - Centang **Auto Confirm User**
4. Klik **Create User**
5. Buka **SQL Editor** dan jalankan:

```sql
UPDATE profiles
SET role = 'admin', nama = 'Administrator'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@mebel.com'
);
```

## Langkah 5: Konfigurasi Auth

1. Buka **Authentication > URL Configuration**
2. Set **Site URL**: `http://localhost:3000` (development) atau URL Vercel (production)
3. Tambahkan ke **Redirect URLs**: `http://localhost:3000/**`

## Langkah 6: Verifikasi

Jalankan query berikut di SQL Editor untuk memverifikasi:

```sql
-- Cek semua tabel terbuat
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Cek RLS aktif
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Cek user admin
SELECT p.id, p.nama, p.role, u.email
FROM profiles p
JOIN auth.users u ON u.id = p.id;
```
