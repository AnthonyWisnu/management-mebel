# Plan Perbaikan — ADIFA Furniture Management System

> Dokumen ini menggabungkan hasil analisis **keamanan**, **fitur**, dan **UI/UX** proyek.
> Setiap item diberi prioritas P0–P3 dan estimasi effort.

---

## Prioritas

| Level | Arti |
|-------|------|
| **P0** | Kritis — keamanan atau data corruption, harus segera diperbaiki |
| **P1** | Penting — berdampak nyata pada pengguna atau integritas data |
| **P2** | Sedang — pengalaman pengguna atau kualitas kode |
| **P3** | Tech debt — cleanup, konsistensi, dan refactor minor |

---

## P0 — Kritis (Keamanan)

### 1. Middleware tidak memproteksi seluruh rute

**File:** `middleware.ts`

Saat ini middleware hanya berjalan di `/` (redirect ke `/dashboard`). Rute seperti `/api/*`, `/pembelian/*`, `/users/*` tidak diproteksi di level middleware — hanya mengandalkan `requireAdmin()` / `requireAuth()` di dalam Server Actions dan halaman.

**Risiko:** Jika ada halaman atau API route yang lupa memanggil `requireAdmin()`, route tersebut bisa diakses tanpa autentikasi.

**Perbaikan:**
```typescript
// middleware.ts
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login).*)",
  ],
}
// Cek session di semua rute, redirect ke /login jika tidak ada
```

**Effort:** S (2–3 jam)

---

### 2. RLS tabel `penggajian` terlalu terbuka

**File:** Supabase RLS policy

Policy `penggajian` saat ini mengizinkan semua authenticated user membaca dan memodifikasi data gaji semua karyawan. Karyawan seharusnya hanya bisa melihat penggajian miliknya sendiri (jika ada fitur self-service).

**Perbaikan:**
```sql
-- Baca: admin bisa semua, pegawai hanya miliknya
CREATE POLICY "penggajian_select" ON penggajian
  FOR SELECT USING (
    get_user_role() = 'admin'
    OR karyawan_id IN (
      SELECT id FROM karyawan WHERE user_id = auth.uid()
    )
  );
```

**Effort:** S (1–2 jam)

---

### 3. RLS tabel `absensi` — INSERT terlalu terbuka

**File:** Supabase RLS policy

Policy INSERT pada `absensi` memungkinkan semua authenticated user menambah absensi untuk karyawan manapun, termasuk memalsukan nominal.

**Perbaikan:**
```sql
-- INSERT hanya admin
CREATE POLICY "absensi_insert" ON absensi
  FOR INSERT WITH CHECK (get_user_role() = 'admin');
```

**Effort:** XS (30 menit)

---

### 4. Validasi file upload hanya di client-side

**File:** `components/ui/NotaUpload.tsx`

Validasi tipe file (jpg/png/pdf) dan ukuran (5MB) hanya dilakukan di browser. Pengguna bisa bypass validasi ini dan mengunggah file berbahaya langsung ke Supabase Storage.

**Perbaikan:**
- Tambahkan validasi di Supabase Storage policy menggunakan `metadata->>'mimetype'`
- Atau buat API route yang memvalidasi file sebelum diteruskan ke Storage

```sql
-- Contoh policy Storage dengan validasi mimetype
CREATE POLICY "nota_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'nota-transaksi'
    AND (storage.foldername(name))[1] IN ('pembelian', 'penjualan')
    AND (metadata->>'mimetype') IN ('image/jpeg','image/png','image/webp','application/pdf')
    AND octet_length(content) <= 5242880
  );
```

**Effort:** M (3–4 jam)

---

### 5. HPP (Harga Pokok Penjualan) terekspos ke role `pegawai`

**File:** `lib/actions/laporan.ts`, `app/(dashboard)/laporan/laporan-client.tsx`

Kolom `subtotal_hpp` dan `total_hpp` di laporan penjualan diambil dari database untuk semua user, lalu disembunyikan hanya di level UI (`isAdmin` prop). Data HPP tetap ada di response JSON yang bisa dilihat di DevTools browser.

**Perbaikan:**
```typescript
// Di server action getLaporanPenjualan
const cols = isAdmin
  ? "..., subtotal_hpp"
  : "..."; // tanpa kolom HPP
```

**Effort:** S (2 jam)

---

## P1 — Penting (Fitur & Data Integrity)

### 6. ~~Tidak ada konfirmasi sebelum hapus data~~ ✅ Sudah diimplementasikan

Semua halaman list sudah menggunakan `AlertDialog` dengan pattern konfirmasi yang konsisten.

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="ghost" size="icon-sm">
      <Trash2 className="h-4 w-4" />
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Hapus data ini?</AlertDialogTitle>
      <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Batal</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Effort:** M (4–6 jam, semua halaman)

---

### 7. ~~Tidak ada soft delete — data hilang permanen~~ ✅ Sudah diimplementasikan

Semua tabel utama menggunakan soft delete via `deleted_at`. Hanya penggajian yang hard-delete (by design, hanya draft yang bisa dihapus).

---

### 8. ~~Laporan tidak bisa export Excel~~ ✅ Sudah diimplementasikan

Semua 5 tab laporan sudah memiliki tombol "Export Excel" menggunakan library `xlsx`.

---

### 9. ~~Tidak ada fitur pencarian/filter di halaman list~~ ✅ Sudah diimplementasikan

Semua halaman list (supplier, pelanggan, produk, karyawan) sudah punya search via komponen `DataTable`.

---

### 10. ~~Validasi stok negatif saat penjualan~~ ✅ Selesai dikerjakan

- `supabase/migrations/007_stok_tracking.sql`: kolom `stok` di produk + DB triggers (pembelian_item, penjualan_item, soft-delete pembelian/penjualan) + hitung ulang dari data existing
- `lib/actions/penjualan.ts`: server-side validation sebelum INSERT (create dan update) dengan pesan error yang informatif
- `types/index.ts`: tambah `stok: number` ke interface Produk
- `produk-client.tsx`: kolom Stok di tabel desktop dan mobile card (merah jika = 0)
- `PenjualanForm.tsx`: tampilkan "Stok: X pcs" di bawah selector produk setiap item

---

### 11. ~~Tidak ada audit log / riwayat perubahan~~ ✅ Selesai dikerjakan

- `supabase/migrations/008_audit_log.sql`: tabel `audit_log` + RLS (hanya admin bisa baca) + trigger `fn_audit_log()` pada tabel penjualan, pembelian, penggajian
- `lib/actions/audit-log.ts`: server action `getAuditLog()`
- `app/(dashboard)/audit-log/`: halaman "Riwayat Aktivitas" dengan tabel desktop + kartu mobile + filter search
- `Sidebar.tsx`: tambah nav item "Riwayat Aktivitas" (adminOnly) di bawah Pengaturan

---

## P2 — Sedang (UI/UX)

### 12. Tombol aksi terlalu kecil — tidak memenuhi standar aksesibilitas

**File:** Semua halaman list (pembelian, penjualan, produk, dll.)

Tombol ikon menggunakan `size="icon-sm"` (28px) dan `size="icon-xs"` (24px). Standar aksesibilitas WCAG merekomendasikan minimal **44×44px** touch target.

**Perbaikan:** Ganti semua `size="icon-sm"` dengan `size="icon"` (32px) dan tambahkan padding touch area:

```tsx
// Dari:
<Button variant="ghost" size="icon-sm">
  <Pencil className="h-3.5 w-3.5" />
</Button>

// Ke:
<Button variant="ghost" size="icon">
  <Pencil className="h-4 w-4" />
</Button>
```

Atau override CSS untuk minimal 44px:
```css
.btn-touch { min-width: 44px; min-height: 44px; }
```

**Effort:** S (2–3 jam, semua halaman)

---

### 13. Font terlalu kecil di tabel laporan

**File:** `app/(dashboard)/laporan/laporan-client.tsx`

Header tabel menggunakan `text-xs` (12px) dan isi baris juga `text-xs`. Terlalu kecil untuk dibaca nyaman, terutama di mobile.

**Perbaikan:**
```tsx
// Header tabel — dari text-xs ke text-sm
<TableHead className="text-sm font-semibold">...</TableHead>

// Isi baris — dari text-xs ke text-sm
<TableCell className="text-sm">...</TableCell>
```

**Effort:** XS (1 jam)

---

### 14. Label form di laporan terlalu kecil

**File:** `app/(dashboard)/laporan/laporan-client.tsx` (sekitar baris 137, 146)

Label filter tanggal menggunakan `text-xs`. Konsistensi dengan shadcn/ui Label default (`text-sm`) lebih baik.

**Perbaikan:** Ganti `className="text-xs ..."` menjadi `className="text-sm ..."` pada komponen Label di filter laporan.

**Effort:** XS (30 menit)

---

### 15. Heading section form terlalu kecil

**File:** `components/forms/PembelianForm.tsx`, `components/forms/PenjualanForm.tsx`

Heading section dalam form (misal "Detail Item") menggunakan `text-xs font-semibold uppercase tracking-wide`. Harusnya minimal `text-sm` agar terbaca jelas.

**Perbaikan:**
```tsx
// Dari:
<h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">

// Ke:
<h3 className="text-sm font-semibold text-foreground">
```

**Effort:** XS (30 menit)

---

### 16. Loading spinner terlalu kecil

**File:** `app/(dashboard)/laporan/laporan-client.tsx`

Icon loader menggunakan `h-3 w-3` (12px). Sulit dilihat.

**Perbaikan:** Ganti menjadi `h-4 w-4` atau `h-5 w-5`.

**Effort:** XS (15 menit)

---

### 17. Input tanggal laporan tidak responsif di mobile

**File:** `app/(dashboard)/laporan/laporan-client.tsx`

Input tanggal menggunakan `className="w-40"` (fixed width 160px). Di layar kecil, ini bisa overflow atau terlalu sempit.

**Perbaikan:** Ganti dengan `className="w-full sm:w-40"` agar full width di mobile.

**Effort:** XS (15 menit)

---

### 18. Inkonsistensi ukuran font di mobile card

**File:** Halaman penggajian vs halaman lainnya

Mobile card penggajian menggunakan `text-xs` untuk subtitle, sementara halaman lain (pembelian, penjualan) menggunakan `text-sm`. Perlu diseragamkan.

**Perbaikan:** Audit semua mobile card dan standarkan: title `text-sm font-medium`, subtitle `text-sm text-muted-foreground`.

**Effort:** XS (1 jam)

---

### 19. Tidak ada feedback visual saat form submit berhasil

**File:** Semua form (pembelian, penjualan, dll.)

Setelah submit berhasil, form langsung navigasi tanpa toast/notifikasi sukses. Pengguna tidak yakin apakah data tersimpan.

**Perbaikan:** Tambahkan toast notifikasi menggunakan `sonner` (sudah tersedia via shadcn/ui):

```typescript
import { toast } from "sonner"

// Setelah berhasil:
toast.success("Data berhasil disimpan")
router.push("/pembelian")
```

**Effort:** S (2–3 jam, semua form)

---

### 20. Tidak ada empty state yang informatif di laporan

**File:** `app/(dashboard)/laporan/laporan-client.tsx`

Ketika laporan kosong (tidak ada data di periode yang dipilih), tidak ada pesan yang menjelaskan. Hanya tabel kosong.

**Perbaikan:** Tambahkan empty state component:
```tsx
{data.length === 0 && (
  <div className="text-center py-12 text-muted-foreground">
    <FileBarChart className="h-8 w-8 mx-auto mb-2 opacity-40" />
    <p className="text-sm">Tidak ada data untuk periode ini</p>
  </div>
)}
```

**Effort:** XS (1 jam)

---

### 21. Tidak ada indikator pagination / total data

**File:** Semua halaman list

Pengguna tidak tahu berapa total data yang ada. Tidak ada info "Menampilkan X dari Y data" atau pagination.

**Perbaikan:** Tambahkan keterangan jumlah data di bawah tabel:
```tsx
<p className="text-sm text-muted-foreground px-1">
  {filteredData.length} dari {data.length} data ditampilkan
</p>
```

**Effort:** XS per halaman (30 menit × N halaman)

---

## P3 — Tech Debt (Kode)

### 22. Duplikasi fungsi formatter di banyak file

**File:** `components/pdf/LaporanPDF.tsx`, `components/pdf/SlipGajiPDF.tsx`, `lib/utils.ts` (jika ada)

Fungsi `fmtRupiah` dan `fmtTgl` dideklarasikan ulang di setiap file PDF. Lebih baik di-extract ke satu utility.

**Perbaikan:**
```typescript
// lib/format.ts
export function fmtRupiah(v: number): string { ... }
export function fmtTgl(dateStr: string): string { ... }
```

**Effort:** XS (1 jam)

---

### 23. Penggunaan `any[]` dan implicit `any` di beberapa tempat

**File:** Berbagai server actions dan komponen

TypeScript strict mode tapi beberapa tempat masih menggunakan `any` secara implisit. Ini mengurangi manfaat type safety.

**Perbaikan:** Audit dengan `tsc --noEmit` dan perbaiki semua `any` yang muncul. Gunakan tipe yang spesifik atau `unknown` dengan type guard.

**Effort:** M (3–4 jam)

---

### 24. Kalkulasi keuangan menggunakan floating-point JavaScript

**File:** Semua kalkulasi subtotal di forms dan server actions

`qty * harga_jual` menggunakan aritmetika float JavaScript yang bisa menghasilkan error presisi (contoh: `0.1 + 0.2 = 0.30000000000000004`).

**Perbaikan:** Gunakan integer (dalam rupiah penuh, tanpa desimal) atau library `decimal.js`/`big.js`:

```typescript
import Decimal from "decimal.js"
const subtotal = new Decimal(qty).times(harga_jual_satuan).toNumber()
```

**Effort:** M (3–5 jam)

---

### 25. `README.md` conflict marker (UU status di git)

**File:** `README.md`

Status git menunjukkan `UU README.md` (unmerged/conflict). File ini perlu di-resolve.

**Perbaikan:** Resolve merge conflict di README.md dan commit.

**Effort:** XS (15 menit)

---

## Ringkasan Prioritas

| No | Item | Prioritas | Effort | Area |
|----|------|-----------|--------|------|
| 1 | Middleware proteksi rute | P0 | S | Keamanan |
| 2 | RLS penggajian terlalu terbuka | P0 | S | Keamanan |
| 3 | RLS absensi INSERT terbuka | P0 | XS | Keamanan |
| 4 | Validasi file upload server-side | P0 | M | Keamanan |
| 5 | HPP terekspos ke pegawai | P0 | S | Keamanan |
| 6 | ~~Konfirmasi sebelum hapus~~ ✅ | P1 | M | Fitur |
| 7 | ~~Soft delete~~ ✅ | P1 | L | Fitur |
| 8 | ~~Export Excel~~ ✅ | P1 | M | Fitur |
| 9 | ~~Pencarian/filter list~~ ✅ | P1 | S | Fitur |
| 10 | ~~Validasi stok~~ ✅ | P1 | S | Fitur |
| 11 | ~~Audit log~~ ✅ | P1 | L | Fitur |
| 12 | Tombol aksi terlalu kecil | P2 | S | UI/UX |
| 13 | Font tabel laporan kecil | P2 | XS | UI/UX |
| 14 | Label filter laporan kecil | P2 | XS | UI/UX |
| 15 | Heading section form kecil | P2 | XS | UI/UX |
| 16 | Loading spinner kecil | P2 | XS | UI/UX |
| 17 | Input tanggal tidak responsif | P2 | XS | UI/UX |
| 18 | Inkonsistensi font mobile card | P2 | XS | UI/UX |
| 19 | Feedback visual form submit | P2 | S | UI/UX |
| 20 | Empty state laporan | P2 | XS | UI/UX |
| 21 | Indikator total data | P2 | XS | UI/UX |
| 22 | Duplikasi formatter | P3 | XS | Kode |
| 23 | Tipe `any` | P3 | M | Kode |
| 24 | Float precision kalkulasi | P3 | M | Kode |
| 25 | README.md conflict | P3 | XS | Kode |

---

## Rekomendasi Urutan Pengerjaan

**Sprint 1 — Keamanan (P0):** Item 1, 2, 3, 5 (semua effort kecil-sedang, dampak besar)

**Sprint 2 — Fitur Kritikal (P1):** Item 6 (konfirmasi hapus), 9 (search), 10 (validasi stok)

**Sprint 3 — UI/UX (P2):** Item 12–21 secara batch (kebanyakan XS effort, bisa dikerjakan dalam 1 hari)

**Sprint 4 — Fitur Besar (P1) + Keamanan sisa:** Item 4, 7, 8, 11

**Sprint 5 — Tech Debt (P3):** Item 22–25

---

*Dokumen dibuat: 27 April 2026*
