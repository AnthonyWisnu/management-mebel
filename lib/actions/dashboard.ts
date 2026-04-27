"use server"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/actions/auth"

type PenjualanDash = {
  id: string
  no_faktur: string | null
  tanggal: string
  total_penjualan: number
  total_hpp: number
  pelanggan: { id: string; nama: string } | null
}

type PembelianDash = {
  id: string
  no_faktur: string | null
  tanggal: string
  total: number
  supplier: { id: string; nama: string } | null
}

type PenggajianDash = { total_dibayar: number }

type PenjualanItemDash = {
  qty: number
  produk: { id: string; nama: string } | null
}

export interface KPIData {
  totalPenjualan: number
  totalPembelian: number
  totalHPP: number
  totalPenggajian: number
  uangKeluar: number
  profitBersih: number
}

export interface TrendPoint {
  tanggal: string
  penjualan: number
  pembelian: number
}

export interface TopProduk {
  nama: string
  qty: number
}

export interface DistribusiSupplier {
  nama: string
  total: number
  pct: number
}

export interface PenjualanRingkas {
  id: string
  no_faktur: string | null
  tanggal: string
  pelanggan_nama: string
  total_penjualan: number
}

export interface PembelianRingkas {
  id: string
  no_faktur: string | null
  tanggal: string
  supplier_nama: string
  total: number
}

export interface DashboardData {
  kpi: KPIData
  trend: TrendPoint[]
  topProduk: TopProduk[]
  distribusiSupplier: DistribusiSupplier[]
  penjualanTerbaru: PenjualanRingkas[]
  pembelianTerbaru: PembelianRingkas[]
}

export async function getDashboardData(
  periodeStart: string,
  periodeEnd: string
): Promise<DashboardData> {
  await requireAdmin()
  const supabase = await createClient()

  const [penjualanResult, pembelianResult, penggajianResult] = await Promise.all([
    supabase
      .from("penjualan")
      .select("id, no_faktur, tanggal, total_penjualan, total_hpp, pelanggan(id, nama)")
      .is("deleted_at", null)
      .gte("tanggal", periodeStart)
      .lte("tanggal", periodeEnd)
      .order("tanggal", { ascending: false }),

    supabase
      .from("pembelian")
      .select("id, no_faktur, tanggal, total, supplier(id, nama)")
      .is("deleted_at", null)
      .gte("tanggal", periodeStart)
      .lte("tanggal", periodeEnd)
      .order("tanggal", { ascending: false }),

    supabase
      .from("penggajian")
      .select("total_dibayar")
      .eq("status", "dibayar")
      .gte("periode_selesai", periodeStart)
      .lte("periode_mulai", periodeEnd),
  ])

  const penjualans = (penjualanResult.data ?? []) as unknown as PenjualanDash[]
  const pembelians = (pembelianResult.data ?? []) as unknown as PembelianDash[]
  const penggajians = (penggajianResult.data ?? []) as unknown as PenggajianDash[]

  // Fetch penjualan_item for top produk (only if there are penjualan)
  let penjualanItems: PenjualanItemDash[] = []
  if (penjualans.length > 0) {
    const ids = penjualans.map((p) => p.id)
    const { data } = await supabase
      .from("penjualan_item")
      .select("qty, produk(id, nama)")
      .in("penjualan_id", ids)
    penjualanItems = (data ?? []) as unknown as PenjualanItemDash[]
  }

  // KPI
  const totalPenjualan = penjualans.reduce((s, p) => s + Number(p.total_penjualan), 0)
  const totalHPP = penjualans.reduce((s, p) => s + Number(p.total_hpp), 0)
  const totalPembelian = pembelians.reduce((s, p) => s + Number(p.total), 0)
  const totalPenggajian = penggajians.reduce((s, p) => s + Number(p.total_dibayar), 0)
  const uangKeluar = totalPembelian + totalPenggajian
  const profitBersih = totalPenjualan - totalHPP - totalPenggajian

  // Trend: aggregate by date
  const trendMap = new Map<string, { penjualan: number; pembelian: number }>()
  penjualans.forEach((p) => {
    const e = trendMap.get(p.tanggal) ?? { penjualan: 0, pembelian: 0 }
    e.penjualan += Number(p.total_penjualan)
    trendMap.set(p.tanggal, e)
  })
  pembelians.forEach((p) => {
    const e = trendMap.get(p.tanggal) ?? { penjualan: 0, pembelian: 0 }
    e.pembelian += Number(p.total)
    trendMap.set(p.tanggal, e)
  })
  const trend: TrendPoint[] = Array.from(trendMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([tanggal, data]) => ({ tanggal, ...data }))

  // Top 5 produk by qty
  const produkMap = new Map<string, { nama: string; qty: number }>()
  penjualanItems.forEach((item) => {
    const nama: string = item.produk?.nama ?? "—"
    const e = produkMap.get(nama) ?? { nama, qty: 0 }
    e.qty += Number(item.qty)
    produkMap.set(nama, e)
  })
  const topProduk: TopProduk[] = Array.from(produkMap.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)

  // Distribusi supplier
  const supplierMap = new Map<string, { nama: string; total: number }>()
  pembelians.forEach((p) => {
    const nama: string = p.supplier?.nama ?? "—"
    const e = supplierMap.get(nama) ?? { nama, total: 0 }
    e.total += Number(p.total)
    supplierMap.set(nama, e)
  })
  const totalBeli = Array.from(supplierMap.values()).reduce((s, v) => s + v.total, 0)
  const distribusiSupplier: DistribusiSupplier[] = Array.from(supplierMap.values())
    .sort((a, b) => b.total - a.total)
    .map((v) => ({
      ...v,
      pct: totalBeli > 0 ? Math.round((v.total / totalBeli) * 100) : 0,
    }))

  // 5 terbaru
  const penjualanTerbaru: PenjualanRingkas[] = penjualans.slice(0, 5).map((p) => ({
    id: p.id,
    no_faktur: p.no_faktur,
    tanggal: p.tanggal,
    pelanggan_nama: p.pelanggan?.nama ?? "—",
    total_penjualan: Number(p.total_penjualan),
  }))
  const pembelianTerbaru: PembelianRingkas[] = pembelians.slice(0, 5).map((p) => ({
    id: p.id,
    no_faktur: p.no_faktur,
    tanggal: p.tanggal,
    supplier_nama: p.supplier?.nama ?? "—",
    total: Number(p.total),
  }))

  return {
    kpi: { totalPenjualan, totalPembelian, totalHPP, totalPenggajian, uangKeluar, profitBersih },
    trend,
    topProduk,
    distribusiSupplier,
    penjualanTerbaru,
    pembelianTerbaru,
  }
}
