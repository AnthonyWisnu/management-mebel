"use client"

import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"
import { useTransition, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { formatRupiah, formatTanggal } from "@/lib/utils"
import { FileDown, FileSpreadsheet, Loader2 } from "lucide-react"
import { exportToExcel } from "@/lib/utils/exportExcel"

import type {
  LaporanPenjualanRow,
  LaporanPembelianRow,
  LaporanProfitRow,
  LaporanAbsensiRow,
  LaporanPenggajianRow,
} from "@/lib/actions/laporan"
import type { Supplier, Pelanggan, Karyawan } from "@/types"
import {
  LaporanPenjualanPDF,
  LaporanPembelianPDF,
  LaporanProfitPDF,
  LaporanAbsensiPDF,
  LaporanPenggajianPDF,
} from "@/components/pdf/LaporanPDF"

// PDFDownloadLink harus dynamic (ssr: false) karena butuh browser API untuk generate PDF
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
)

const TIPE_SHIFT_LABEL: Record<string, string> = {
  setengah_hari: "1/2 Hari",
  satu_hari: "1 Hari",
  lembur: "Lembur",
}

interface Props {
  isAdmin: boolean
  activeTab: string
  dari: string
  sampai: string
  pelangganId: string
  supplierId: string
  karyawanId: string
  suppliers: Supplier[]
  pelanggans: Pelanggan[]
  karyawans: Karyawan[]
  penjualanData: LaporanPenjualanRow[]
  pembelianData: LaporanPembelianRow[]
  profitData: LaporanProfitRow[]
  absensiData: LaporanAbsensiRow[]
  penggajianData: LaporanPenggajianRow[]
}

function EmptyData() {
  return (
    <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
      Tidak ada data untuk filter yang dipilih
    </div>
  )
}

function periodeLabel(dari: string, sampai: string) {
  if (dari && sampai) return `${formatTanggal(dari)} – ${formatTanggal(sampai)}`
  if (dari) return `Mulai ${formatTanggal(dari)}`
  if (sampai) return `Sampai ${formatTanggal(sampai)}`
  return "Semua periode"
}

export function LaporanClient({
  isAdmin,
  activeTab,
  dari,
  sampai,
  pelangganId,
  supplierId,
  karyawanId,
  suppliers,
  pelanggans,
  karyawans,
  penjualanData,
  pembelianData,
  profitData,
  absensiData,
  penggajianData,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Local filter state
  const [localDari, setLocalDari] = useState(dari)
  const [localSampai, setLocalSampai] = useState(sampai)
  const [localPelangganId, setLocalPelangganId] = useState(pelangganId)
  const [localSupplierId, setLocalSupplierId] = useState(supplierId)
  const [localKaryawanId, setLocalKaryawanId] = useState(karyawanId)

  function switchTab(tab: string) {
    startTransition(() => {
      const p = new URLSearchParams(searchParams.toString())
      p.set("tab", tab)
      router.push(`/laporan?${p.toString()}`)
    })
  }

  function applyFilter(tab: string) {
    startTransition(() => {
      const p = new URLSearchParams()
      p.set("tab", tab)
      if (localDari) p.set("dari", localDari)
      if (localSampai) p.set("sampai", localSampai)
      const validId = (v: string) => v && v !== "__all"
      if (tab === "penjualan" && validId(localPelangganId)) p.set("pelanggan_id", localPelangganId)
      if (tab === "pembelian" && validId(localSupplierId)) p.set("supplier_id", localSupplierId)
      if ((tab === "absensi" || tab === "penggajian") && validId(localKaryawanId))
        p.set("karyawan_id", localKaryawanId)
      router.push(`/laporan?${p.toString()}`)
    })
  }

  const periodeStr = periodeLabel(dari, sampai)

  // ─── Shared filter fields ────────────────────────────────────────────────────

  function DateFilters() {
    return (
      <div className="flex flex-wrap gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Dari Tanggal</Label>
          <Input
            type="date"
            value={localDari}
            onChange={(e) => setLocalDari(e.target.value)}
            className="w-40 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Sampai Tanggal</Label>
          <Input
            type="date"
            value={localSampai}
            onChange={(e) => setLocalSampai(e.target.value)}
            className="w-40 text-sm"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Laporan</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generate dan export laporan ke PDF atau Excel
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={switchTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="penjualan">Penjualan</TabsTrigger>
          {isAdmin && <TabsTrigger value="pembelian">Pembelian</TabsTrigger>}
          {isAdmin && <TabsTrigger value="profit">Profit</TabsTrigger>}
          <TabsTrigger value="absensi">Absensi</TabsTrigger>
          <TabsTrigger value="penggajian">Penggajian</TabsTrigger>
        </TabsList>

        {/* ─── Tab: Penjualan ──────────────────────────────────────────────── */}
        <TabsContent value="penjualan" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-4 space-y-3">
              <DateFilters />
              <div className="space-y-1">
                <Label className="text-xs">Pelanggan</Label>
                <Select value={localPelangganId} onValueChange={(v) => setLocalPelangganId(v ?? "")}>
                  <SelectTrigger className="w-52 text-sm">
                    <SelectValue placeholder="Semua pelanggan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">Semua pelanggan</SelectItem>
                    {pelanggans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                size="sm"
                onClick={() => applyFilter("penjualan")}
                disabled={isPending}
              >
                {isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                Tampilkan
              </Button>
            </CardContent>
          </Card>

          <LaporanPenjualanTable data={penjualanData} isAdmin={isAdmin} />

          {penjualanData.length > 0 && (
            <ExportBar
              onExcelClick={() =>
                exportToExcel(
                  penjualanData,
                  [
                    { header: "No Faktur", key: "no_faktur", width: 18 },
                    {
                      header: "Tanggal",
                      key: "tanggal",
                      width: 14,
                      formatter: (v) => formatTanggal(v as string),
                    },
                    { header: "Pelanggan", key: "pelanggan_nama", width: 22 },
                    { header: "Produk", key: "produk_nama", width: 24 },
                    { header: "Qty", key: "qty", width: 8 },
                    {
                      header: "Harga Jual",
                      key: "harga_jual_satuan",
                      width: 16,
                      formatter: (v) => formatRupiah(v as number),
                    },
                    {
                      header: "Subtotal Jual",
                      key: "subtotal_jual",
                      width: 18,
                      formatter: (v) => formatRupiah(v as number),
                    },
                    ...(isAdmin
                      ? [
                          {
                            header: "Subtotal HPP",
                            key: "subtotal_hpp" as keyof LaporanPenjualanRow,
                            width: 18,
                            formatter: (v: unknown) => formatRupiah(v as number),
                          },
                        ]
                      : []),
                  ],
                  `laporan-penjualan-${new Date().toISOString().slice(0, 10)}`,
                  "Penjualan"
                )
              }
              pdfDocument={
                <LaporanPenjualanPDF
                  data={penjualanData}
                  isAdmin={isAdmin}
                  periode={periodeStr}
                />
              }
              pdfFilename={`laporan-penjualan-${new Date().toISOString().slice(0, 10)}.pdf`}
            />
          )}
        </TabsContent>

        {/* ─── Tab: Pembelian ──────────────────────────────────────────────── */}
        {isAdmin && (
          <TabsContent value="pembelian" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-4 space-y-3">
                <DateFilters />
                <div className="space-y-1">
                  <Label className="text-xs">Supplier</Label>
                  <Select value={localSupplierId} onValueChange={(v) => setLocalSupplierId(v ?? "")}>
                    <SelectTrigger className="w-52 text-sm">
                      <SelectValue placeholder="Semua supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all">Semua supplier</SelectItem>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" onClick={() => applyFilter("pembelian")} disabled={isPending}>
                  {isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  Tampilkan
                </Button>
              </CardContent>
            </Card>

            <LaporanPembelianTable data={pembelianData} />

            {pembelianData.length > 0 && (
              <ExportBar
                onExcelClick={() =>
                  exportToExcel(
                    pembelianData,
                    [
                      { header: "No Faktur", key: "no_faktur", width: 18 },
                      {
                        header: "Tanggal",
                        key: "tanggal",
                        width: 14,
                        formatter: (v) => formatTanggal(v as string),
                      },
                      { header: "Supplier", key: "supplier_nama", width: 22 },
                      { header: "Produk", key: "produk_nama", width: 24 },
                      { header: "Qty", key: "qty", width: 8 },
                      {
                        header: "Harga Beli",
                        key: "harga_beli_satuan",
                        width: 16,
                        formatter: (v) => formatRupiah(v as number),
                      },
                      {
                        header: "Subtotal",
                        key: "subtotal",
                        width: 18,
                        formatter: (v) => formatRupiah(v as number),
                      },
                    ],
                    `laporan-pembelian-${new Date().toISOString().slice(0, 10)}`,
                    "Pembelian"
                  )
                }
                pdfDocument={<LaporanPembelianPDF data={pembelianData} periode={periodeStr} />}
                pdfFilename={`laporan-pembelian-${new Date().toISOString().slice(0, 10)}.pdf`}
              />
            )}
          </TabsContent>
        )}

        {/* ─── Tab: Profit ─────────────────────────────────────────────────── */}
        {isAdmin && (
          <TabsContent value="profit" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-4 space-y-3">
                <DateFilters />
                <Button size="sm" onClick={() => applyFilter("profit")} disabled={isPending}>
                  {isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  Tampilkan
                </Button>
              </CardContent>
            </Card>

            <LaporanProfitTable data={profitData} />

            {profitData.length > 0 && (
              <ExportBar
                onExcelClick={() =>
                  exportToExcel(
                    profitData,
                    [
                      {
                        header: "Tanggal",
                        key: "tanggal",
                        width: 14,
                        formatter: (v) => formatTanggal(v as string),
                      },
                      {
                        header: "Total Penjualan",
                        key: "total_penjualan",
                        width: 20,
                        formatter: (v) => formatRupiah(v as number),
                      },
                      {
                        header: "Total HPP",
                        key: "total_hpp",
                        width: 18,
                        formatter: (v) => formatRupiah(v as number),
                      },
                      {
                        header: "Total Pembelian",
                        key: "total_pembelian",
                        width: 18,
                        formatter: (v) => formatRupiah(v as number),
                      },
                      {
                        header: "Total Penggajian",
                        key: "total_penggajian",
                        width: 18,
                        formatter: (v) => formatRupiah(v as number),
                      },
                      {
                        header: "Profit Bersih",
                        key: "profit_bersih",
                        width: 18,
                        formatter: (v) => formatRupiah(v as number),
                      },
                    ],
                    `laporan-profit-${new Date().toISOString().slice(0, 10)}`,
                    "Profit"
                  )
                }
                pdfDocument={<LaporanProfitPDF data={profitData} periode={periodeStr} />}
                pdfFilename={`laporan-profit-${new Date().toISOString().slice(0, 10)}.pdf`}
              />
            )}
          </TabsContent>
        )}

        {/* ─── Tab: Absensi ─────────────────────────────────────────────────── */}
        <TabsContent value="absensi" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-4 space-y-3">
              <DateFilters />
              <div className="space-y-1">
                <Label className="text-xs">Karyawan</Label>
                <Select value={localKaryawanId} onValueChange={(v) => setLocalKaryawanId(v ?? "")}>
                  <SelectTrigger className="w-52 text-sm">
                    <SelectValue placeholder="Semua karyawan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">Semua karyawan</SelectItem>
                    {karyawans.map((k) => (
                      <SelectItem key={k.id} value={k.id}>
                        {k.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" onClick={() => applyFilter("absensi")} disabled={isPending}>
                {isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                Tampilkan
              </Button>
            </CardContent>
          </Card>

          <LaporanAbsensiTable data={absensiData} />

          {absensiData.length > 0 && (
            <ExportBar
              onExcelClick={() =>
                exportToExcel(
                  absensiData,
                  [
                    {
                      header: "Tanggal",
                      key: "tanggal",
                      width: 14,
                      formatter: (v) => formatTanggal(v as string),
                    },
                    { header: "Karyawan", key: "karyawan_nama", width: 24 },
                    {
                      header: "Tipe Shift",
                      key: "tipe_shift",
                      width: 14,
                      formatter: (v) => TIPE_SHIFT_LABEL[v as string] ?? (v as string),
                    },
                    {
                      header: "Nominal",
                      key: "nominal",
                      width: 16,
                      formatter: (v) => formatRupiah(v as number),
                    },
                    { header: "Catatan", key: "catatan", width: 24 },
                  ],
                  `laporan-absensi-${new Date().toISOString().slice(0, 10)}`,
                  "Absensi"
                )
              }
              pdfDocument={<LaporanAbsensiPDF data={absensiData} periode={periodeStr} />}
              pdfFilename={`laporan-absensi-${new Date().toISOString().slice(0, 10)}.pdf`}
            />
          )}
        </TabsContent>

        {/* ─── Tab: Penggajian ──────────────────────────────────────────────── */}
        <TabsContent value="penggajian" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-4 space-y-3">
              <DateFilters />
              <div className="space-y-1">
                <Label className="text-xs">Karyawan</Label>
                <Select value={localKaryawanId} onValueChange={(v) => setLocalKaryawanId(v ?? "")}>
                  <SelectTrigger className="w-52 text-sm">
                    <SelectValue placeholder="Semua karyawan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">Semua karyawan</SelectItem>
                    {karyawans.map((k) => (
                      <SelectItem key={k.id} value={k.id}>
                        {k.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" onClick={() => applyFilter("penggajian")} disabled={isPending}>
                {isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                Tampilkan
              </Button>
            </CardContent>
          </Card>

          <LaporanPenggajianTable data={penggajianData} />

          {penggajianData.length > 0 && (
            <ExportBar
              onExcelClick={() =>
                exportToExcel(
                  penggajianData,
                  [
                    {
                      header: "Periode Mulai",
                      key: "periode_mulai",
                      width: 14,
                      formatter: (v) => formatTanggal(v as string),
                    },
                    {
                      header: "Periode Selesai",
                      key: "periode_selesai",
                      width: 14,
                      formatter: (v) => formatTanggal(v as string),
                    },
                    { header: "Karyawan", key: "karyawan_nama", width: 24 },
                    {
                      header: "Total Kalkulasi",
                      key: "total_gaji_kalkulasi",
                      width: 18,
                      formatter: (v) => formatRupiah(v as number),
                    },
                    {
                      header: "Total Dibayar",
                      key: "total_dibayar",
                      width: 18,
                      formatter: (v) => formatRupiah(v as number),
                    },
                    { header: "Status", key: "status", width: 12 },
                  ],
                  `laporan-penggajian-${new Date().toISOString().slice(0, 10)}`,
                  "Penggajian"
                )
              }
              pdfDocument={<LaporanPenggajianPDF data={penggajianData} periode={periodeStr} />}
              pdfFilename={`laporan-penggajian-${new Date().toISOString().slice(0, 10)}.pdf`}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Table Components ─────────────────────────────────────────────────────────

function LaporanPenjualanTable({
  data,
  isAdmin,
}: {
  data: LaporanPenjualanRow[]
  isAdmin: boolean
}) {
  if (!data.length) return <EmptyData />

  const totalJual = data.reduce((s, r) => s + r.subtotal_jual, 0)
  const totalHpp = data.reduce((s, r) => s + r.subtotal_hpp, 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Hasil Laporan Penjualan ({data.length} item)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-xs">No Faktur</th>
                <th className="text-left px-4 py-2 font-medium text-xs">Tanggal</th>
                <th className="text-left px-4 py-2 font-medium text-xs">Pelanggan</th>
                <th className="text-left px-4 py-2 font-medium text-xs">Produk</th>
                <th className="text-right px-4 py-2 font-medium text-xs">Qty</th>
                <th className="text-right px-4 py-2 font-medium text-xs">Harga Jual</th>
                <th className="text-right px-4 py-2 font-medium text-xs">Subtotal</th>
                {isAdmin && (
                  <th className="text-right px-4 py-2 font-medium text-xs">Subtotal HPP</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((r, i) => (
                <tr key={i} className="hover:bg-muted/20">
                  <td className="px-4 py-2 text-xs">{r.no_faktur ?? "—"}</td>
                  <td className="px-4 py-2 text-xs">{formatTanggal(r.tanggal)}</td>
                  <td className="px-4 py-2 text-xs">{r.pelanggan_nama}</td>
                  <td className="px-4 py-2 text-xs">{r.produk_nama}</td>
                  <td className="px-4 py-2 text-xs text-right">{r.qty}</td>
                  <td className="px-4 py-2 text-xs text-right">{formatRupiah(r.harga_jual_satuan)}</td>
                  <td className="px-4 py-2 text-xs text-right">{formatRupiah(r.subtotal_jual)}</td>
                  {isAdmin && (
                    <td className="px-4 py-2 text-xs text-right">{formatRupiah(r.subtotal_hpp)}</td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/40 font-medium">
              <tr>
                <td colSpan={isAdmin ? 6 : 6} className="px-4 py-2 text-xs text-right">
                  Total
                </td>
                <td className="px-4 py-2 text-xs text-right">{formatRupiah(totalJual)}</td>
                {isAdmin && (
                  <td className="px-4 py-2 text-xs text-right">{formatRupiah(totalHpp)}</td>
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function LaporanPembelianTable({ data }: { data: LaporanPembelianRow[] }) {
  if (!data.length) return <EmptyData />

  const total = data.reduce((s, r) => s + r.subtotal, 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Hasil Laporan Pembelian ({data.length} item)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-xs">No Faktur</th>
                <th className="text-left px-4 py-2 font-medium text-xs">Tanggal</th>
                <th className="text-left px-4 py-2 font-medium text-xs">Supplier</th>
                <th className="text-left px-4 py-2 font-medium text-xs">Produk</th>
                <th className="text-right px-4 py-2 font-medium text-xs">Qty</th>
                <th className="text-right px-4 py-2 font-medium text-xs">Harga Beli</th>
                <th className="text-right px-4 py-2 font-medium text-xs">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((r, i) => (
                <tr key={i} className="hover:bg-muted/20">
                  <td className="px-4 py-2 text-xs">{r.no_faktur ?? "—"}</td>
                  <td className="px-4 py-2 text-xs">{formatTanggal(r.tanggal)}</td>
                  <td className="px-4 py-2 text-xs">{r.supplier_nama}</td>
                  <td className="px-4 py-2 text-xs">{r.produk_nama}</td>
                  <td className="px-4 py-2 text-xs text-right">{r.qty}</td>
                  <td className="px-4 py-2 text-xs text-right">{formatRupiah(r.harga_beli_satuan)}</td>
                  <td className="px-4 py-2 text-xs text-right">{formatRupiah(r.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/40 font-medium">
              <tr>
                <td colSpan={6} className="px-4 py-2 text-xs text-right">Total</td>
                <td className="px-4 py-2 text-xs text-right">{formatRupiah(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function LaporanProfitTable({ data }: { data: LaporanProfitRow[] }) {
  if (!data.length) return <EmptyData />

  const sumProfit = data.reduce((s, r) => s + r.profit_bersih, 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Hasil Laporan Profit ({data.length} hari)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-xs">Tanggal</th>
                <th className="text-right px-4 py-2 font-medium text-xs">Total Penjualan</th>
                <th className="text-right px-4 py-2 font-medium text-xs">Total HPP</th>
                <th className="text-right px-4 py-2 font-medium text-xs">Total Pembelian</th>
                <th className="text-right px-4 py-2 font-medium text-xs">Total Penggajian</th>
                <th className="text-right px-4 py-2 font-medium text-xs">Profit Bersih</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((r, i) => (
                <tr key={i} className="hover:bg-muted/20">
                  <td className="px-4 py-2 text-xs">{formatTanggal(r.tanggal)}</td>
                  <td className="px-4 py-2 text-xs text-right">{formatRupiah(r.total_penjualan)}</td>
                  <td className="px-4 py-2 text-xs text-right">{formatRupiah(r.total_hpp)}</td>
                  <td className="px-4 py-2 text-xs text-right">{formatRupiah(r.total_pembelian)}</td>
                  <td className="px-4 py-2 text-xs text-right">{formatRupiah(r.total_penggajian)}</td>
                  <td
                    className={`px-4 py-2 text-xs text-right font-medium ${
                      r.profit_bersih < 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {formatRupiah(r.profit_bersih)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/40 font-medium">
              <tr>
                <td colSpan={5} className="px-4 py-2 text-xs text-right">Total Profit Bersih</td>
                <td
                  className={`px-4 py-2 text-xs text-right ${
                    sumProfit < 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {formatRupiah(sumProfit)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function LaporanAbsensiTable({ data }: { data: LaporanAbsensiRow[] }) {
  if (!data.length) return <EmptyData />

  const totalNominal = data.reduce((s, r) => s + r.nominal, 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Hasil Laporan Absensi ({data.length} entri)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-xs">Tanggal</th>
                <th className="text-left px-4 py-2 font-medium text-xs">Karyawan</th>
                <th className="text-left px-4 py-2 font-medium text-xs">Tipe Shift</th>
                <th className="text-right px-4 py-2 font-medium text-xs">Nominal</th>
                <th className="text-left px-4 py-2 font-medium text-xs">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((r, i) => (
                <tr key={i} className="hover:bg-muted/20">
                  <td className="px-4 py-2 text-xs">{formatTanggal(r.tanggal)}</td>
                  <td className="px-4 py-2 text-xs">{r.karyawan_nama}</td>
                  <td className="px-4 py-2 text-xs">
                    {TIPE_SHIFT_LABEL[r.tipe_shift] ?? r.tipe_shift}
                  </td>
                  <td className="px-4 py-2 text-xs text-right">{formatRupiah(r.nominal)}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{r.catatan ?? "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/40 font-medium">
              <tr>
                <td colSpan={3} className="px-4 py-2 text-xs text-right">Total</td>
                <td className="px-4 py-2 text-xs text-right">{formatRupiah(totalNominal)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function LaporanPenggajianTable({ data }: { data: LaporanPenggajianRow[] }) {
  if (!data.length) return <EmptyData />

  const totalDibayar = data.reduce((s, r) => s + r.total_dibayar, 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Hasil Laporan Penggajian ({data.length} entri)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-xs">Periode</th>
                <th className="text-left px-4 py-2 font-medium text-xs">Karyawan</th>
                <th className="text-right px-4 py-2 font-medium text-xs">Total Kalkulasi</th>
                <th className="text-right px-4 py-2 font-medium text-xs">Total Dibayar</th>
                <th className="text-center px-4 py-2 font-medium text-xs">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((r, i) => (
                <tr key={i} className="hover:bg-muted/20">
                  <td className="px-4 py-2 text-xs">
                    {formatTanggal(r.periode_mulai)} – {formatTanggal(r.periode_selesai)}
                  </td>
                  <td className="px-4 py-2 text-xs">{r.karyawan_nama}</td>
                  <td className="px-4 py-2 text-xs text-right">
                    {formatRupiah(r.total_gaji_kalkulasi)}
                  </td>
                  <td className="px-4 py-2 text-xs text-right">{formatRupiah(r.total_dibayar)}</td>
                  <td className="px-4 py-2 text-xs text-center">
                    <Badge
                      variant={r.status === "dibayar" ? "default" : "secondary"}
                      className={
                        r.status === "dibayar"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }
                    >
                      {r.status === "dibayar" ? "Dibayar" : "Draft"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/40 font-medium">
              <tr>
                <td colSpan={3} className="px-4 py-2 text-xs text-right">Total Dibayar</td>
                <td className="px-4 py-2 text-xs text-right">{formatRupiah(totalDibayar)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Export Bar ────────────────────────────────────────────────────────────

interface ExportBarProps {
  onExcelClick: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdfDocument: React.ReactElement<any>
  pdfFilename: string
}

function ExportBar({ onExcelClick, pdfDocument, pdfFilename }: ExportBarProps) {
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={onExcelClick}>
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Export Excel
      </Button>
      <PDFDownloadLink document={pdfDocument} fileName={pdfFilename}>
        {({ loading }) => (
          <Button size="sm" variant="outline" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            {loading ? "Memuat PDF..." : "Export PDF"}
          </Button>
        )}
      </PDFDownloadLink>
    </div>
  )
}
