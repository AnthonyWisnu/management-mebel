"use server"

import { createClient } from "@/lib/supabase/server"
import { requireAuth, requireAdmin } from "@/lib/actions/auth"

// ─── Laporan Penjualan ───────────────────────────────────────────────────────

export interface LaporanPenjualanRow {
  no_faktur: string | null
  tanggal: string
  pelanggan_nama: string
  produk_nama: string
  qty: number
  harga_jual_satuan: number
  hpp_satuan: number
  subtotal_jual: number
  subtotal_hpp: number
  total_penjualan: number
}

export interface LaporanPenjualanFilter {
  dari?: string
  sampai?: string
  pelanggan_id?: string
}

export async function getLaporanPenjualan(
  filter: LaporanPenjualanFilter
): Promise<LaporanPenjualanRow[]> {
  const profile = await requireAuth()
  const isAdmin = profile.role === "admin"
  const supabase = await createClient()

  let q = supabase
    .from("penjualan")
    .select(
      "no_faktur, tanggal, total_penjualan, total_hpp, pelanggan(nama), penjualan_item(qty, harga_jual_satuan, hpp_satuan, subtotal_jual, subtotal_hpp, produk(nama))"
    )
    .is("deleted_at", null)
    .order("tanggal", { ascending: false })

  if (filter.dari) q = q.gte("tanggal", filter.dari)
  if (filter.sampai) q = q.lte("tanggal", filter.sampai)
  if (filter.pelanggan_id) q = q.eq("pelanggan_id", filter.pelanggan_id)

  const { data, error } = await q
  if (error) throw new Error(error.message)

  const rows: LaporanPenjualanRow[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const pj of (data ?? []) as any[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const item of (pj.penjualan_item ?? []) as any[]) {
      rows.push({
        no_faktur: pj.no_faktur,
        tanggal: pj.tanggal,
        pelanggan_nama: pj.pelanggan?.nama ?? "—",
        produk_nama: item.produk?.nama ?? "—",
        qty: Number(item.qty),
        harga_jual_satuan: Number(item.harga_jual_satuan),
        hpp_satuan: isAdmin ? Number(item.hpp_satuan) : 0,
        subtotal_jual: Number(item.subtotal_jual),
        subtotal_hpp: isAdmin ? Number(item.subtotal_hpp) : 0,
        total_penjualan: Number(pj.total_penjualan),
      })
    }
  }
  return rows
}

// ─── Laporan Pembelian ───────────────────────────────────────────────────────

export interface LaporanPembelianRow {
  no_faktur: string | null
  tanggal: string
  supplier_nama: string
  produk_nama: string
  qty: number
  harga_beli_satuan: number
  subtotal: number
  total: number
}

export interface LaporanPembelianFilter {
  dari?: string
  sampai?: string
  supplier_id?: string
}

export async function getLaporanPembelian(
  filter: LaporanPembelianFilter
): Promise<LaporanPembelianRow[]> {
  await requireAdmin()
  const supabase = await createClient()

  let q = supabase
    .from("pembelian")
    .select(
      "no_faktur, tanggal, total, supplier(nama), pembelian_item(qty, harga_beli_satuan, subtotal, produk(nama))"
    )
    .is("deleted_at", null)
    .order("tanggal", { ascending: false })

  if (filter.dari) q = q.gte("tanggal", filter.dari)
  if (filter.sampai) q = q.lte("tanggal", filter.sampai)
  if (filter.supplier_id) q = q.eq("supplier_id", filter.supplier_id)

  const { data, error } = await q
  if (error) throw new Error(error.message)

  const rows: LaporanPembelianRow[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const pb of (data ?? []) as any[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const item of (pb.pembelian_item ?? []) as any[]) {
      rows.push({
        no_faktur: pb.no_faktur,
        tanggal: pb.tanggal,
        supplier_nama: pb.supplier?.nama ?? "—",
        produk_nama: item.produk?.nama ?? "—",
        qty: Number(item.qty),
        harga_beli_satuan: Number(item.harga_beli_satuan),
        subtotal: Number(item.subtotal),
        total: Number(pb.total),
      })
    }
  }
  return rows
}

// ─── Laporan Profit ─────────────────────────────────────────────────────────

export interface LaporanProfitRow {
  tanggal: string
  total_penjualan: number
  total_hpp: number
  total_pembelian: number
  total_penggajian: number
  profit_bersih: number
}

export interface LaporanProfitFilter {
  dari?: string
  sampai?: string
}

export async function getLaporanProfit(
  filter: LaporanProfitFilter
): Promise<LaporanProfitRow[]> {
  await requireAdmin()
  const supabase = await createClient()

  const [penjualanResult, pembelianResult, penggajianResult] = await Promise.all([
    (() => {
      let q = supabase
        .from("penjualan")
        .select("tanggal, total_penjualan, total_hpp")
        .is("deleted_at", null)
      if (filter.dari) q = q.gte("tanggal", filter.dari)
      if (filter.sampai) q = q.lte("tanggal", filter.sampai)
      return q
    })(),
    (() => {
      let q = supabase
        .from("pembelian")
        .select("tanggal, total")
        .is("deleted_at", null)
      if (filter.dari) q = q.gte("tanggal", filter.dari)
      if (filter.sampai) q = q.lte("tanggal", filter.sampai)
      return q
    })(),
    (() => {
      let q = supabase
        .from("penggajian")
        .select("periode_selesai, total_dibayar")
        .eq("status", "dibayar")
      if (filter.dari) q = q.gte("periode_selesai", filter.dari)
      if (filter.sampai) q = q.lte("periode_mulai", filter.sampai)
      return q
    })(),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const penjualans: any[] = penjualanResult.data ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pembelians: any[] = pembelianResult.data ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const penggajians: any[] = penggajianResult.data ?? []

  // Aggregate by date
  const map = new Map<
    string,
    { total_penjualan: number; total_hpp: number; total_pembelian: number; total_penggajian: number }
  >()

  const get = (d: string) =>
    map.get(d) ?? { total_penjualan: 0, total_hpp: 0, total_pembelian: 0, total_penggajian: 0 }

  penjualans.forEach((p) => {
    const e = get(p.tanggal)
    e.total_penjualan += Number(p.total_penjualan)
    e.total_hpp += Number(p.total_hpp)
    map.set(p.tanggal, e)
  })
  pembelians.forEach((p) => {
    const e = get(p.tanggal)
    e.total_pembelian += Number(p.total)
    map.set(p.tanggal, e)
  })
  penggajians.forEach((p) => {
    const e = get(p.periode_selesai)
    e.total_penggajian += Number(p.total_dibayar)
    map.set(p.periode_selesai, e)
  })

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([tanggal, v]) => ({
      tanggal,
      ...v,
      profit_bersih: v.total_penjualan - v.total_hpp - v.total_penggajian,
    }))
}

// ─── Laporan Absensi ─────────────────────────────────────────────────────────

export interface LaporanAbsensiRow {
  tanggal: string
  karyawan_nama: string
  tipe_shift: string
  nominal: number
  catatan: string | null
}

export interface LaporanAbsensiFilter {
  dari?: string
  sampai?: string
  karyawan_id?: string
}

export async function getLaporanAbsensi(
  filter: LaporanAbsensiFilter
): Promise<LaporanAbsensiRow[]> {
  await requireAuth()
  const supabase = await createClient()

  let q = supabase
    .from("absensi")
    .select("tanggal, tipe_shift, nominal, catatan, karyawan(nama)")
    .is("deleted_at", null)
    .order("tanggal", { ascending: false })

  if (filter.dari) q = q.gte("tanggal", filter.dari)
  if (filter.sampai) q = q.lte("tanggal", filter.sampai)
  if (filter.karyawan_id) q = q.eq("karyawan_id", filter.karyawan_id)

  const { data, error } = await q
  if (error) throw new Error(error.message)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((a: any) => ({
    tanggal: a.tanggal,
    karyawan_nama: a.karyawan?.nama ?? "—",
    tipe_shift: a.tipe_shift,
    nominal: Number(a.nominal),
    catatan: a.catatan,
  }))
}

// ─── Laporan Penggajian ──────────────────────────────────────────────────────

export interface LaporanPenggajianRow {
  periode_mulai: string
  periode_selesai: string
  karyawan_nama: string
  total_gaji_kalkulasi: number
  total_dibayar: number
  status: string
}

export interface LaporanPenggajianFilter {
  dari?: string
  sampai?: string
  karyawan_id?: string
}

export async function getLaporanPenggajian(
  filter: LaporanPenggajianFilter
): Promise<LaporanPenggajianRow[]> {
  await requireAuth()
  const supabase = await createClient()

  let q = supabase
    .from("penggajian")
    .select("periode_mulai, periode_selesai, total_gaji_kalkulasi, total_dibayar, status, karyawan(nama)")
    .order("periode_mulai", { ascending: false })

  if (filter.dari) q = q.gte("periode_mulai", filter.dari)
  if (filter.sampai) q = q.lte("periode_selesai", filter.sampai)
  if (filter.karyawan_id) q = q.eq("karyawan_id", filter.karyawan_id)

  const { data, error } = await q
  if (error) throw new Error(error.message)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((p: any) => ({
    periode_mulai: p.periode_mulai,
    periode_selesai: p.periode_selesai,
    karyawan_nama: p.karyawan?.nama ?? "—",
    total_gaji_kalkulasi: Number(p.total_gaji_kalkulasi),
    total_dibayar: Number(p.total_dibayar),
    status: p.status,
  }))
}
