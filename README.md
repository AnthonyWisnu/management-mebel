# Sistem Manajemen Toko Mebel

Aplikasi manajemen operasional toko mebel berbasis web yang mencakup master data, transaksi pembelian dan penjualan, manajemen SDM, laporan keuangan, serta pencatatan hutang dan piutang.

## Fitur Utama

### Master Data
- Manajemen supplier (dengan saldo kredit)
- Manajemen pelanggan (dengan saldo kredit)
- Kategori produk
- Produk dengan stok otomatis
- Data karyawan

### Transaksi
- Pembelian dari supplier (multi-item, status pembayaran)
- Penjualan kepada pelanggan (multi-item, status pembayaran)
- Pelacakan stok otomatis pada setiap transaksi

### Hutang dan Piutang
- Hutang pembelian ke supplier
- Piutang penjualan dari pelanggan
- Pencatatan pembayaran bertahap (cicilan)
- Saldo kredit otomatis untuk kelebihan bayar
- Status pembayaran: Lunas, Sebagian, Belum Bayar

### SDM dan Penggajian
- Absensi harian karyawan
- Penggajian mingguan berdasarkan tarif harian dan lembur

### Dashboard dan Laporan
- KPI ringkasan (pendapatan, pembelian, profit, transaksi)
- Grafik tren penjualan, produk terlaris, distribusi supplier
- 5 jenis laporan dengan ekspor ke Excel dan PDF:
  - Laporan Penjualan
  - Laporan Pembelian
  - Laporan Profit
  - Laporan Absensi
  - Laporan Penggajian

### Keamanan
- Autentikasi berbasis Supabase Auth
- Row Level Security (RLS) di semua tabel
- Peran pengguna: admin (akses penuh) dan pegawai (akses terbatas)
- Audit log untuk semua perubahan data sensitif
- Soft delete pada semua tabel utama

---

## Teknologi

| Kategori | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | Supabase (PostgreSQL) |
| Autentikasi | Supabase Auth + SSR |
| Bahasa | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Komponen UI | Base UI, Radix UI, shadcn/ui |
| Form | react-hook-form + Zod v4 |
| Tabel | TanStack Table v8 |
| Grafik | Recharts |
| PDF | @react-pdf/renderer |
| Excel | xlsx |
| Notifikasi | Sonner |

---

## Prasyarat

- Node.js 20 atau lebih baru
- npm 10 atau lebih baru
- Akun Supabase (free tier sudah cukup)

---

## Cara Menjalankan

### 1. Clone repositori

```bash
git clone <url-repo>
cd management
```

### 2. Install dependensi

```bash
npm install
```

### 3. Konfigurasi environment

Buat file `.env.local` di root proyek:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Nilai URL dan anon key dapat ditemukan di dashboard Supabase pada menu Project Settings > API.

### 4. Jalankan migrasi database

Buka Supabase SQL Editor lalu jalankan file migrasi secara berurutan:

```
supabase/migrations/001_schema.sql
supabase/migrations/002_rls.sql
supabase/migrations/003_storage.sql
supabase/migrations/004_seed.sql
supabase/migrations/005_rls_patch.sql
supabase/migrations/006_nota_storage.sql
supabase/migrations/007_stok_tracking.sql
supabase/migrations/008_audit_log.sql
supabase/migrations/009_rls_security_patch2.sql
supabase/migrations/010_hutang_piutang.sql
```

Setiap file harus dijalankan satu per satu, sesuai urutan nomor.

### 5. (Opsional) Muat data dummy

Untuk mengisi database dengan data contoh bulan April 2026:

```
supabase/migrations/seed_dummy_april2026.sql
```

Data dummy mencakup supplier, pelanggan, produk, karyawan, transaksi pembelian dan penjualan, absensi, penggajian, serta catatan hutang dan piutang.

### 6. Buat akun admin pertama

Di Supabase SQL Editor, jalankan perintah berikut setelah membuat akun melalui Supabase Auth > Users:

```sql
INSERT INTO public.profiles (id, email, nama, role)
VALUES ('<user-uuid>', 'admin@example.com', 'Administrator', 'admin');
```

Ganti `<user-uuid>` dengan UUID dari akun yang sudah dibuat.

### 7. Jalankan aplikasi

```bash
npm run dev
```

Buka `http://localhost:3000` di browser.

---

## Struktur Proyek

```
management/
|-- app/
|   |-- (auth)/               # Halaman login
|   `-- (dashboard)/          # Semua halaman setelah login
|       |-- dashboard/
|       |-- supplier/
|       |-- pelanggan/
|       |-- kategori/
|       |-- produk/
|       |-- karyawan/
|       |-- pembelian/
|       |-- penjualan/
|       |-- hutang-piutang/
|       |-- absensi/
|       |-- penggajian/
|       |-- laporan/
|       |-- users/
|       `-- audit-log/
|-- components/
|   |-- forms/                # Form input reusable
|   |-- tables/               # DataTable
|   |-- charts/               # Recharts wrappers
|   |-- pdf/                  # Template PDF
|   |-- layout/               # Sidebar, Header, Nav
|   `-- ui/                   # Komponen dasar UI
|-- lib/
|   |-- actions/              # Server Actions Next.js
|   |-- supabase/             # Client Supabase (server & browser)
|   |-- validations/          # Skema Zod
|   `-- utils/                # Utility functions
|-- types/
|   `-- index.ts              # Semua TypeScript interface
`-- supabase/
    `-- migrations/           # SQL schema dan seed
```

---

## Peran Pengguna

### Admin
Akses penuh ke semua fitur:
- Master data (CRUD)
- Transaksi pembelian dan penjualan (CRUD)
- Hutang dan piutang (lihat dan catat pembayaran)
- Manajemen karyawan dan absensi
- Penggajian
- Laporan dan ekspor
- Manajemen akun pengguna
- Audit log

### Pegawai
Akses terbatas:
- Melihat data karyawan (tanpa hapus)
- Membuat transaksi penjualan baru
- Melihat absensi
- Laporan terbatas

---

## Catatan Teknis

### Sistem Hutang dan Piutang

Hutang dan piutang tidak dibuat secara otomatis oleh trigger database. Logika pencatatan terjadi di server action (`lib/actions/hutang-piutang-helper.ts`) yang dipanggil saat transaksi pembelian atau penjualan dibuat, diubah, atau dihapus.

Alur pencatatan:
- Jika `total_dibayar < total`, selisih dicatat sebagai hutang (pembelian) atau piutang (penjualan)
- Jika `total_dibayar > total`, kelebihan ditambahkan ke saldo kredit pihak terkait
- Jika `total_dibayar == total`, transaksi langsung lunas tanpa catatan hutang atau piutang

Karena alur ini berjalan di lapisan aplikasi bukan sebagai trigger SQL, data dummy di `seed_dummy_april2026.sql` mengisi tabel `hutang_piutang` secara manual dengan nilai yang sudah konsisten.

### Soft Delete

Semua tabel utama menggunakan kolom `deleted_at`. Data yang dihapus tidak benar-benar dihapus dari database, hanya ditandai dengan timestamp penghapusan. Semua query memfilter `deleted_at IS NULL` secara otomatis melalui RLS dan server actions.

### Stok Produk

Stok produk diperbarui oleh server action saat transaksi dibuat atau dihapus. Tidak ada trigger database untuk ini. Validasi stok negatif diterapkan di server action sebelum transaksi penjualan disimpan.
