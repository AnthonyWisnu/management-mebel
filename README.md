# Sistem Manajemen Mebel

Aplikasi web manajemen operasional usaha mebel mencakup transaksi pembelian & penjualan, absensi, penggajian, dan dashboard keuangan.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)

---

## Tentang Project

**Sistem Manajemen Mebel** adalah aplikasi web full-stack untuk mengelola operasional usaha mebel skala kecil hingga menengah. Dibangun dengan arsitektur modern menggunakan **Next.js App Router** dan **Supabase** sebagai backend, aplikasi ini mendukung dua peran pengguna (admin dan pegawai) dengan hak akses berbeda di setiap fitur.

---

## Fitur Utama

### Dashboard Keuangan
- KPI ringkasan: Uang Masuk, Uang Keluar, HPP, dan Profit Bersih
- Grafik tren penjualan vs pembelian (line chart)
- Top 5 produk terlaris (bar chart)
- Distribusi pembelian per supplier (pie chart)
- Filter periode: Hari Ini, 7 Hari, Bulan Ini, Bulan Lalu, Tahun Ini, Custom Range

### Transaksi
- **Pembelian** Pencatatan pembelian ke supplier dengan multi-item detail
- **Penjualan** Pencatatan penjualan ke pelanggan dengan HPP per item
- Perhitungan subtotal dan total otomatis, upload bukti nota/struk

### Master Data
- Manajemen Supplier, Pelanggan, Karyawan, Produk, dan Kategori Produk
- CRUD lengkap dengan pencarian, filter, dan sortable columns
- Soft delete untuk menjaga integritas referensi historis
- Pelacakan stok otomatis melalui database trigger

### Absensi & Penggajian
- Pencatatan absensi harian: shift setengah hari, satu hari, dan lembur
- Nominal gaji otomatis dari master karyawan (dapat di-override)
- Generate slip penggajian mingguan otomatis dari rekap absensi
- Cetak slip gaji dalam format PDF

### Laporan & Export
- Laporan Penjualan, Pembelian, Profit, Absensi, dan Penggajian
- Export ke **PDF** dan **Excel**
- Filter berdasarkan rentang tanggal, pelanggan, supplier, karyawan

### Keamanan
- Route protection via server-side authentication (Next.js Proxy)
- Row Level Security (RLS) di semua tabel Supabase
- Validasi file upload menggunakan magic bytes (bukan hanya ekstensi)
- Audit log otomatis untuk perubahan data transaksi dan penggajian

---

## Hak Akses

| Fitur                | Admin | Pegawai      |
|----------------------|-------|--------------|
| Dashboard Keuangan   | Ya    | Tidak        |
| Transaksi Pembelian  | Ya    | Tidak        |
| Transaksi Penjualan  | Ya    | Ya           |
| Master Data (CRUD)   | Penuh | Tanpa Delete |
| Absensi & Penggajian | Ya    | Ya           |
| Laporan & Export     | Ya    | Ya           |
| Manajemen User       | Ya    | Tidak        |
| Riwayat Aktivitas    | Ya    | Tidak        |

---

## Tech Stack

| Layer          | Teknologi                              |
|----------------|----------------------------------------|
| Framework      | Next.js 16 (App Router, TypeScript)    |
| Styling        | Tailwind CSS 4 + shadcn/ui             |
| Icons          | Lucide React                           |
| Database       | Supabase (PostgreSQL)                  |
| Auth           | Supabase Auth (Email + Password)       |
| Storage        | Supabase Storage                       |
| Forms          | React Hook Form + Zod                  |
| Tables         | TanStack Table                         |
| Charts         | Recharts                               |
| PDF Export     | @react-pdf/renderer                    |
| Excel Export   | SheetJS (xlsx)                         |
| Deployment     | Vercel                                 |

---

## Getting Started

### Prasyarat

- Node.js v18 atau lebih baru
- Akun [Supabase](https://supabase.com/) (gratis)

### 1. Clone Repository

```bash
git clone https://github.com/AnthonyWisnu/management-mebel.git
cd management-mebel
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com)
2. Buka **Settings > API** dan salin URL serta API keys
3. Buka **SQL Editor** dan jalankan file migrasi secara berurutan:

   | File | Keterangan |
   |------|------------|
   | `supabase/migrations/001_schema.sql` | Schema dan tabel utama |
   | `supabase/migrations/002_rls.sql` | Row Level Security policies |
   | `supabase/migrations/003_storage.sql` | Storage bucket untuk nota |
   | `supabase/migrations/004_seed.sql` | Seed data awal |
   | `supabase/migrations/005_rls_patch.sql` | Patch RLS tambahan |
   | `supabase/migrations/006_users_management.sql` | Manajemen user |
   | `supabase/migrations/007_stok_tracking.sql` | Trigger pelacakan stok |
   | `supabase/migrations/008_audit_log.sql` | Tabel dan trigger audit log |
   | `supabase/migrations/009_rls_security_patch2.sql` | Patch keamanan RLS |

4. Buat user admin pertama:
   - Buka **Authentication > Users > Add user > Create new user**
   - Centang **Auto Confirm User**, lalu jalankan query berikut:

   ```sql
   UPDATE profiles
   SET role = 'admin', nama = 'Administrator'
   WHERE id = (
     SELECT id FROM auth.users WHERE email = 'your@email.com'
   );
   ```

### 4. Konfigurasi Environment

Salin `.env.example` menjadi `.env.local` dan isi dengan kredensial Supabase:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 5. Jalankan Development Server

```bash
npm run dev
```

Aplikasi berjalan di [http://localhost:3000](http://localhost:3000).

---

## Struktur Project

```
management-mebel/
├── app/
│   ├── (auth)/login/            # Halaman autentikasi
│   ├── (dashboard)/             # Halaman utama (protected)
│   │   ├── audit-log/
│   │   ├── dashboard/
│   │   ├── absensi/
│   │   ├── karyawan/
│   │   ├── kategori/
│   │   ├── laporan/
│   │   ├── pelanggan/
│   │   ├── pembelian/
│   │   ├── penggajian/
│   │   ├── penjualan/
│   │   ├── produk/
│   │   ├── supplier/
│   │   └── users/
│   └── api/upload/nota/         # API route upload file
├── components/
│   ├── charts/                  # Komponen grafik
│   ├── dashboard/               # KPI cards
│   ├── forms/                   # Form per modul
│   ├── layout/                  # Sidebar, TopBar, DashboardShell
│   ├── pdf/                     # Template PDF laporan dan slip gaji
│   ├── tables/                  # DataTable reusable
│   └── ui/                      # shadcn/ui components
├── lib/
│   ├── actions/                 # Server Actions per modul
│   ├── supabase/                # Supabase client dan server helper
│   ├── utils.ts                 # Utility functions (format, generate)
│   └── validations/             # Zod schemas
├── supabase/
│   ├── migrations/              # SQL migration files
│   └── SETUP.md
├── types/
│   └── index.ts                 # TypeScript type definitions
└── proxy.ts                     # Route protection (auth middleware)
```

---

## Database Schema

| Tabel              | Deskripsi                                           |
|--------------------|-----------------------------------------------------|
| `profiles`         | Data user, terhubung 1:1 ke `auth.users`            |
| `supplier`         | Data supplier / pemasok                             |
| `karyawan`         | Data karyawan beserta tarif gaji per shift          |
| `pelanggan`        | Data pelanggan                                      |
| `kategori_produk`  | Kategori produk                                     |
| `produk`           | Data produk beserta stok                            |
| `pembelian`        | Header transaksi pembelian                          |
| `pembelian_item`   | Detail item pembelian                               |
| `penjualan`        | Header transaksi penjualan                          |
| `penjualan_item`   | Detail item penjualan (termasuk HPP)                |
| `absensi`          | Catatan absensi harian karyawan                     |
| `penggajian`       | Slip penggajian mingguan                            |
| `audit_log`        | Log perubahan data transaksi dan penggajian         |

Semua tabel dilindungi Row Level Security (RLS) berdasarkan role user.

---

## Deployment

1. Push repository ke GitHub
2. Import repository di [vercel.com](https://vercel.com)
3. Tambahkan environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Klik **Deploy**

Setelah deploy, perbarui **Site URL** dan **Redirect URLs** di Supabase Dashboard > Authentication > URL Configuration dengan URL production Vercel.

---

## License

Project ini bersifat private dan digunakan untuk keperluan internal.
