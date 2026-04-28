export type Role = "admin" | "pegawai"
export type TipeShift = "setengah_hari" | "satu_hari" | "lembur"
export type StatusPenggajian = "draft" | "dibayar"
export type StatusBayar = "lunas" | "sebagian" | "belum_lunas"

export interface Profile {
  id: string
  nama: string | null
  role: Role
  aktif: boolean
  created_at: string
  updated_at: string | null
}

export interface Supplier {
  id: string
  nama: string
  alamat: string | null
  no_telp: string | null
  email: string | null
  catatan: string | null
  saldo_kredit: number
  created_at: string
  updated_at: string | null
  deleted_at: string | null
}

export interface Karyawan {
  id: string
  nama: string
  alamat: string | null
  no_telp: string | null
  jabatan: string | null
  gaji_setengah_hari: number
  gaji_satu_hari: number
  tanggal_bergabung: string | null
  aktif: boolean
  created_at: string
  updated_at: string | null
  deleted_at: string | null
}

export interface Pelanggan {
  id: string
  nama: string
  alamat: string | null
  no_telp: string | null
  email: string | null
  catatan: string | null
  saldo_kredit: number
  created_at: string
  updated_at: string | null
  deleted_at: string | null
}

export interface KategoriProduk {
  id: string
  nama: string
  deskripsi: string | null
  created_at: string
  updated_at: string | null
  deleted_at: string | null
}

export interface Produk {
  id: string
  kategori_id: string
  nama: string
  deskripsi: string | null
  satuan: string
  stok: number
  foto_url: string | null
  created_at: string
  updated_at: string | null
  deleted_at: string | null
  kategori_produk?: KategoriProduk
}

export interface Pembelian {
  id: string
  no_faktur: string | null
  tanggal: string
  supplier_id: string
  total: number
  total_dibayar: number
  status_bayar: StatusBayar
  catatan: string | null
  nota_url: string | null
  dibuat_oleh: string | null
  created_at: string
  updated_at: string | null
  deleted_at: string | null
  supplier?: Supplier
  pembelian_item?: PembelianItem[]
}

export interface PembelianItem {
  id: string
  pembelian_id: string
  produk_id: string
  qty: number
  harga_beli_satuan: number
  subtotal: number
  created_at: string
  produk?: Produk
}

export interface Penjualan {
  id: string
  no_faktur: string | null
  tanggal: string
  pelanggan_id: string
  total_penjualan: number
  total_hpp: number
  profit: number
  total_dibayar: number
  status_bayar: StatusBayar
  catatan: string | null
  nota_url: string | null
  dibuat_oleh: string | null
  created_at: string
  updated_at: string | null
  deleted_at: string | null
  pelanggan?: Pelanggan
  penjualan_item?: PenjualanItem[]
}

export interface PenjualanItem {
  id: string
  penjualan_id: string
  produk_id: string
  qty: number
  harga_jual_satuan: number
  hpp_satuan: number
  subtotal_jual: number
  subtotal_hpp: number
  created_at: string
  produk?: Produk
}

export interface Absensi {
  id: string
  tanggal: string
  karyawan_id: string
  tipe_shift: TipeShift
  nominal: number
  catatan: string | null
  dibuat_oleh: string | null
  created_at: string
  updated_at: string | null
  deleted_at: string | null
  karyawan?: Karyawan
}

export interface Penggajian {
  id: string
  karyawan_id: string
  periode_mulai: string
  periode_selesai: string
  total_gaji_kalkulasi: number
  total_dibayar: number
  status: StatusPenggajian
  tanggal_bayar: string | null
  catatan: string | null
  dibuat_oleh: string | null
  created_at: string
  updated_at: string | null
  karyawan?: Karyawan
  absensi?: Absensi[]
}

export interface HutangPiutang {
  id: string
  tipe: "hutang" | "piutang"
  sumber: "penjualan" | "pembelian"
  sumber_id: string
  pihak_tipe: "pelanggan" | "supplier"
  pelanggan_id: string | null
  supplier_id: string | null
  nominal: number
  saldo_terpakai: number
  terbayar: number
  sisa: number
  status: StatusBayar
  tanggal: string
  jatuh_tempo: string | null
  catatan: string | null
  pelanggan?: Pick<Pelanggan, "id" | "nama">
  supplier?: Pick<Supplier, "id" | "nama">
  created_at: string
  updated_at: string | null
  deleted_at: string | null
}

export interface PembayaranHP {
  id: string
  hutang_piutang_id: string
  jumlah: number
  tanggal: string
  catatan: string | null
  created_at: string
}

export type StatusPO = "pending" | "dalam_proses" | "selesai" | "dibatalkan"

export interface PurchaseOrder {
  id: string
  no_po: string
  tanggal_po: string
  batas_waktu: string
  pelanggan_id: string
  status: StatusPO
  total_estimasi: number
  catatan: string | null
  dibuat_oleh: string | null
  created_at: string
  updated_at: string | null
  deleted_at: string | null
  pelanggan?: Pick<Pelanggan, "id" | "nama" | "no_telp">
  purchase_order_item?: POItem[]
}

export interface POItem {
  id: string
  po_id: string
  deskripsi: string
  qty: number
  harga_satuan: number
  subtotal: number
  catatan: string | null
  created_at: string
}
