import { requireAuth } from "@/lib/actions/auth"
import { getSuppliers } from "@/lib/actions/supplier"
import { getPelanggan } from "@/lib/actions/pelanggan"
import { getKaryawan } from "@/lib/actions/karyawan"
import {
  getLaporanPenjualan,
  getLaporanPembelian,
  getLaporanProfit,
  getLaporanAbsensi,
  getLaporanPenggajian,
  type LaporanPenjualanRow,
  type LaporanPembelianRow,
  type LaporanProfitRow,
  type LaporanAbsensiRow,
  type LaporanPenggajianRow,
} from "@/lib/actions/laporan"
import { LaporanClient } from "./laporan-client"

export const metadata = { title: "Laporan" }

type TabType = "penjualan" | "pembelian" | "profit" | "absensi" | "penggajian"

interface PageProps {
  searchParams: Promise<{
    tab?: string
    dari?: string
    sampai?: string
    pelanggan_id?: string
    supplier_id?: string
    karyawan_id?: string
  }>
}

export default async function LaporanPage({ searchParams }: PageProps) {
  const profile = await requireAuth()
  const isAdmin = profile.role === "admin"
  const params = await searchParams

  const tab = (params.tab as TabType) ?? "penjualan"
  const dari = params.dari ?? ""
  const sampai = params.sampai ?? ""
  const pelangganId = params.pelanggan_id ?? ""
  const supplierId = params.supplier_id ?? ""
  const karyawanId = params.karyawan_id ?? ""

  // Fetch master data for filter dropdowns (always needed)
  const [suppliers, pelanggans, karyawans] = await Promise.all([
    isAdmin ? getSuppliers() : Promise.resolve([]),
    getPelanggan(),
    getKaryawan(),
  ])

  // Fetch laporan data based on active tab
  let penjualanData: LaporanPenjualanRow[] = []
  let pembelianData: LaporanPembelianRow[] = []
  let profitData: LaporanProfitRow[] = []
  let absensiData: LaporanAbsensiRow[] = []
  let penggajianData: LaporanPenggajianRow[] = []

  const filter = { dari: dari || undefined, sampai: sampai || undefined }

  if (tab === "penjualan") {
    penjualanData = await getLaporanPenjualan({
      ...filter,
      pelanggan_id: pelangganId || undefined,
    })
  } else if (tab === "pembelian" && isAdmin) {
    pembelianData = await getLaporanPembelian({
      ...filter,
      supplier_id: supplierId || undefined,
    })
  } else if (tab === "profit" && isAdmin) {
    profitData = await getLaporanProfit(filter)
  } else if (tab === "absensi") {
    absensiData = await getLaporanAbsensi({
      ...filter,
      karyawan_id: karyawanId || undefined,
    })
  } else if (tab === "penggajian") {
    penggajianData = await getLaporanPenggajian({
      ...filter,
      karyawan_id: karyawanId || undefined,
    })
  }

  return (
    <LaporanClient
      isAdmin={isAdmin}
      activeTab={tab}
      dari={dari}
      sampai={sampai}
      pelangganId={pelangganId}
      supplierId={supplierId}
      karyawanId={karyawanId}
      suppliers={suppliers}
      pelanggans={pelanggans}
      karyawans={karyawans}
      penjualanData={penjualanData}
      pembelianData={pembelianData}
      profitData={profitData}
      absensiData={absensiData}
      penggajianData={penggajianData}
    />
  )
}
