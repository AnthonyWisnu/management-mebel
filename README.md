<p align="center">
  <h1 align="center"> Sistem Manajemen Mebel</h1>
  <p align="center">
    Aplikasi web manajemen operasional usaha mebel — mencakup transaksi, absensi, penggajian, dan dashboard keuangan.
  </p>
</p>

<p align="center">
  <a href="#fitur-utama">Fitur</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#struktur-project">Struktur</a> •
  <a href="#deployment">Deployment</a>
</p>

---

## Tentang Project

**Sistem Manajemen Mebel** adalah aplikasi web full-stack yang dirancang untuk mengelola operasional usaha mebel skala kecil hingga menengah. Aplikasi ini mencakup pencatatan transaksi pembelian & penjualan, manajemen absensi & penggajian karyawan, serta dashboard ringkasan keuangan real-time untuk pemilik usaha.

Dibangun dengan arsitektur modern menggunakan **Next.js App Router** dan **Supabase** sebagai backend, aplikasi ini siap di-deploy ke **Vercel** dan mendukung penggunaan penuh di desktop maupun mobile.

---

## Fitur Utama

### Dashboard Keuangan (Admin)
- KPI Cards: Uang Masuk, Uang Keluar, HPP, dan Profit Bersih
- Grafik penjualan vs pembelian (line chart)
- Top 5 produk terlaris (bar chart)
- Distribusi pembelian per supplier (pie chart)
- Filter periode: Hari Ini, 7 Hari, Bulan Ini, Bulan Lalu, Tahun Ini, Custom Range

### Transaksi
- **Pembelian** — Pencatatan pembelian ke supplier dengan multi-item detail
- **Penjualan** — Pencatatan penjualan ke pelanggan dengan HPP per item (admin only)
- Harga beli, harga jual, dan HPP diinput manual per transaksi (fleksibel)
- Perhitungan subtotal & total otomatis

### Master Data
- Manajemen Supplier, Pelanggan, Karyawan, Produk, dan Kategori Produk
- CRUD lengkap dengan search, filter, pagination, dan sortable columns
- Soft delete untuk menjaga referensi historis

### Absensi & Penggajian
- Pencatatan absensi harian: shift setengah hari, satu hari, dan lembur
- Nominal gaji otomatis dari master karyawan (dapat di-override)
- Generate penggajian mingguan otomatis dari rekap absensi
- Cetak slip gaji dalam format PDF

### Laporan & Export
- Laporan Penjualan, Pembelian, Profit, Absensi, dan Penggajian
- Export ke **PDF** dan **Excel**
- Filter berdasarkan rentang tanggal, pelanggan, supplier, karyawan, dll.

### Role-Based Access Control
|          Fitur       | Admin |    Pegawai   |
|----------------------|-------|--------------|
| Dashboard Keuanganm  | ✅   |       ❌     |
| Transaksi Pembelianm | ✅   |       ❌     |
| Transaksi Penjualan  | ✅   |       ✅     |
| Master Data (CRUD)   | Full  | Tanpa Delete |
| Absensi & Penggajian | ✅   |       ✅     |
| Laporan & Export     | ✅   |       ✅     |
| Manajemen User       | ✅   |       ❌     |
| Hapus Data           | ✅   |       ❌     |

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| **Framework** | Next.js 16 (App Router, TypeScript) |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **Icons** | Lucide React |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (Email + Password) |
| **Storage** | Supabase Storage |
| **Forms** | React Hook Form + Zod validation |
| **Tables** | TanStack Table |
| **Charts** | Recharts |
| **PDF Export** | @react-pdf/renderer |
| **Excel Export** | SheetJS (xlsx) |
| **Deployment** | Vercel |

---

## Getting Started

### Prasyarat

- [Node.js](https://nodejs.org/) v18 atau lebih baru
- [Git](https://git-scm.com/)
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
2. Buka **Settings > API** dan salin API keys
3. Buka **SQL Editor** dan jalankan file migrasi secara berurutan:

   ```
   supabase/migrations/001_schema.sql   → Schema & tabel
   supabase/migrations/002_rls.sql      → Row Level Security policies
   supabase/migrations/003_storage.sql  → Storage bucket untuk foto produk
   supabase/migrations/004_seed.sql     → Seed data kategori produk
   supabase/migrations/005_rls_patch.sql → Patch RLS tambahan
   ```

4. Buat user admin pertama:
   - Buka **Authentication > Users > Add user > Create new user**
   - Email: `admin@mebel.com` / Password: `Admin123!`
   - Centang **Auto Confirm User**
   - Jalankan di SQL Editor:
     ```sql
     UPDATE profiles
     SET role = 'admin', nama = 'Administrator'
     WHERE id = (
       SELECT id FROM auth.users WHERE email = 'admin@mebel.com'
     );
     ```

> Panduan lengkap setup Supabase tersedia di [`supabase/SETUP.md`](supabase/SETUP.md)

### 4. Konfigurasi Environment

Salin file `.env.example` menjadi `.env.local` dan isi dengan kredensial Supabase Anda:

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

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## Struktur Project

```
management-mebel/
├── app/
│   ├── (auth)/                  # Halaman autentikasi
│   │   └── login/
│   ├── (dashboard)/             # Halaman utama (protected)
│   │   ├── absensi/
│   │   ├── dashboard/
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
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── charts/                  # Komponen grafik (Bar, Line, Pie)
│   ├── dashboard/               # KPI Cards
│   ├── forms/                   # Form untuk setiap modul
│   ├── layout/                  # Sidebar, TopBar, DashboardShell
│   ├── pdf/                     # Template PDF (Laporan, Slip Gaji)
│   ├── tables/                  # DataTable reusable
│   └── ui/                      # shadcn/ui components
├── lib/
│   ├── actions/                 # Server Actions untuk setiap modul
│   ├── supabase/                # Supabase client, server, middleware
│   ├── utils/                   # Helper functions (export Excel, dll)
│   └── validations/             # Zod schemas
├── supabase/
│   ├── migrations/              # SQL migration files
│   └── SETUP.md                 # Panduan setup Supabase
├── types/
│   └── index.ts                 # TypeScript type definitions
├── public/                      # Static assets
└── package.json
```

---

## Database Schema

Aplikasi menggunakan **Supabase (PostgreSQL)** dengan tabel-tabel berikut:

| Tabel | Deskripsi |
|---|---|
| `profiles` | Data user (terhubung 1:1 ke `auth.users`) |
| `supplier` | Data supplier / pemasok |
| `karyawan` | Data karyawan beserta tarif gaji |
| `pelanggan` | Data pelanggan |
| `kategori_produk` | Kategori produk |
| `produk` | Data produk (tanpa harga, harga diinput per transaksi) |
| `pembelian` | Header transaksi pembelian |
| `pembelian_item` | Detail item pembelian |
| `penjualan` | Header transaksi penjualan |
| `penjualan_item` | Detail item penjualan (termasuk HPP) |
| `absensi` | Catatan absensi harian karyawan |
| `penggajian` | Slip penggajian mingguan |

Semua tabel dilindungi **Row Level Security (RLS)** berdasarkan role user.

---

## 📱 Responsive Design

Aplikasi dirancang **mobile-first** dan berfungsi penuh di semua ukuran layar:

- **Mobile (360px+):** Tabel berubah menjadi card stack, form menggunakan layout vertikal, sidebar menjadi drawer hamburger
- **Tablet (768px+):** Layout hybrid dengan sidebar collapsible
- **Desktop (1024px+):** Full sidebar dengan tabel dan form lengkap

---

## Deployment

### Deploy ke Vercel

1. Push repository ke GitHub
2. Buka [vercel.com](https://vercel.com) dan import repository
3. Tambahkan **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Klik **Deploy**

Jangan lupa update **Site URL** dan **Redirect URLs** di Supabase Dashboard > Authentication > URL Configuration dengan URL Vercel production Anda.

---

## License

Project ini bersifat private dan digunakan untuk keperluan internal.

---

<p align="center">
  Dibuat dengan menggunakan Next.js & Supabase
</p>
