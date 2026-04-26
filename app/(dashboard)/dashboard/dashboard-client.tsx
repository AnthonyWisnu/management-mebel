"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { KPICard } from "@/components/dashboard/KPICard"
import { TrendLineChart } from "@/components/charts/LineChart"
import { TopProdukBarChart } from "@/components/charts/BarChart"
import { DistribusiSupplierPieChart } from "@/components/charts/PieChart"
import { formatRupiah, formatTanggal } from "@/lib/utils"
import {
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  Wallet,
} from "lucide-react"
import type { DashboardData } from "@/lib/actions/dashboard"

type PeriodeOption = "hari_ini" | "7_hari" | "bulan_ini" | "bulan_lalu" | "tahun_ini" | "custom"

const PERIODE_LABELS: Record<PeriodeOption, string> = {
  hari_ini: "Hari Ini",
  "7_hari": "7 Hari Terakhir",
  bulan_ini: "Bulan Ini",
  bulan_lalu: "Bulan Lalu",
  tahun_ini: "Tahun Ini",
  custom: "Custom Range",
}

interface Props {
  data: DashboardData
  periodeAktif: PeriodeOption
  customDari: string
  customSampai: string
}

export function DashboardClient({ data, periodeAktif, customDari, customSampai }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [customFrom, setCustomFrom] = useState(customDari)
  const [customTo, setCustomTo] = useState(customSampai)

  function navigatePeriode(p: PeriodeOption) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("periode", p)
      params.delete("dari")
      params.delete("sampai")
      router.push(`/dashboard?${params.toString()}`)
    })
  }

  function applyCustom() {
    if (!customFrom || !customTo) return
    startTransition(() => {
      router.push(`/dashboard?periode=custom&dari=${customFrom}&sampai=${customTo}`)
    })
  }

  const { kpi, trend, topProduk, distribusiSupplier, penjualanTerbaru, pembelianTerbaru } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Ringkasan keuangan dan operasional</p>
      </div>

      {/* Filter Periode */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PERIODE_LABELS) as PeriodeOption[]).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={periodeAktif === p ? "default" : "outline"}
                onClick={() => navigatePeriode(p)}
                disabled={isPending}
              >
                {PERIODE_LABELS[p]}
              </Button>
            ))}
          </div>

          {periodeAktif === "custom" && (
            <div className="mt-4 flex flex-wrap gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-xs">Dari</Label>
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-40 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Sampai</Label>
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-40 text-sm"
                />
              </div>
              <Button size="sm" onClick={applyCustom} disabled={isPending || !customFrom || !customTo}>
                Terapkan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Uang Masuk"
          value={kpi.totalPenjualan}
          icon={ArrowDownCircle}
          variant="positive"
          description="Total penjualan periode ini"
        />
        <KPICard
          title="Uang Keluar"
          value={kpi.uangKeluar}
          icon={ArrowUpCircle}
          variant="negative"
          description={`Pembelian + penggajian`}
        />
        <KPICard
          title="HPP"
          value={kpi.totalHPP}
          icon={Wallet}
          variant="neutral"
          description="Harga pokok penjualan"
        />
        <KPICard
          title="Profit Bersih"
          value={kpi.profitBersih}
          icon={TrendingUp}
          variant={kpi.profitBersih >= 0 ? "positive" : "negative"}
          description="Penjualan - HPP - Penggajian"
        />
      </div>

      {/* Grafik Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tren Penjualan vs Pembelian</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendLineChart data={trend} />
        </CardContent>
      </Card>

      {/* Grafik Batang + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top 5 Produk Terlaris</CardTitle>
          </CardHeader>
          <CardContent>
            <TopProdukBarChart data={topProduk} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribusi Pembelian per Supplier</CardTitle>
          </CardHeader>
          <CardContent>
            <DistribusiSupplierPieChart data={distribusiSupplier} />
          </CardContent>
        </Card>
      </div>

      {/* Tabel Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 5 Penjualan Terbaru */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">5 Penjualan Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {penjualanTerbaru.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">Tidak ada penjualan dalam periode ini</p>
            ) : (
              <div className="divide-y">
                {penjualanTerbaru.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{p.no_faktur ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.pelanggan_nama} · {formatTanggal(p.tanggal)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-green-600">
                      {formatRupiah(p.total_penjualan)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 5 Pembelian Terbaru */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">5 Pembelian Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {pembelianTerbaru.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">Tidak ada pembelian dalam periode ini</p>
            ) : (
              <div className="divide-y">
                {pembelianTerbaru.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{p.no_faktur ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.supplier_nama} · {formatTanggal(p.tanggal)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-red-600">
                      {formatRupiah(p.total)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
