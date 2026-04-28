"use client"

import { useState, useTransition, useMemo } from "react"
import { useRouter } from "next/navigation"
import { type ColumnDef } from "@tanstack/react-table"
import { Banknote, Filter, X } from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CatatPembayaranForm } from "@/components/forms/CatatPembayaranForm"
import { cn, formatRupiah, formatTanggal } from "@/lib/utils"
import type { HutangPiutang, StatusBayar } from "@/types"

const STATUS_BAYAR_VARIANT: Record<StatusBayar, "default" | "secondary" | "destructive"> = {
  lunas:       "default",
  sebagian:    "secondary",
  belum_lunas: "destructive",
}

const STATUS_BAYAR_LABEL: Record<StatusBayar, string> = {
  lunas:       "Lunas",
  sebagian:    "Sebagian",
  belum_lunas: "Belum Bayar",
}

interface HutangPiutangClientProps {
  initialData: HutangPiutang[]
}

export function HutangPiutangClient({ initialData }: HutangPiutangClientProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [selectedHP, setSelectedHP] = useState<HutangPiutang | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("piutang")

  const [tanggalDari, setTanggalDari] = useState("")
  const [tanggalSampai, setTanggalSampai] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("semua")
  const [showFilter, setShowFilter] = useState(false)

  const hasFilter = tanggalDari || tanggalSampai || statusFilter !== "semua"

  const resetFilter = () => {
    setTanggalDari("")
    setTanggalSampai("")
    setStatusFilter("semua")
  }

  const piutang = useMemo(() =>
    initialData
      .filter((hp) => hp.tipe === "piutang")
      .filter((hp) => {
        if (tanggalDari && hp.tanggal < tanggalDari) return false
        if (tanggalSampai && hp.tanggal > tanggalSampai) return false
        if (statusFilter !== "semua" && hp.status !== statusFilter) return false
        return true
      }),
    [initialData, tanggalDari, tanggalSampai, statusFilter]
  )

  const hutang = useMemo(() =>
    initialData
      .filter((hp) => hp.tipe === "hutang")
      .filter((hp) => {
        if (tanggalDari && hp.tanggal < tanggalDari) return false
        if (tanggalSampai && hp.tanggal > tanggalSampai) return false
        if (statusFilter !== "semua" && hp.status !== statusFilter) return false
        return true
      }),
    [initialData, tanggalDari, tanggalSampai, statusFilter]
  )

  const totalSisaPiutang = piutang
    .filter((hp) => hp.status !== "lunas")
    .reduce((sum, hp) => sum + hp.sisa, 0)

  const totalSisaHutang = hutang
    .filter((hp) => hp.status !== "lunas")
    .reduce((sum, hp) => sum + hp.sisa, 0)

  const handleBayar = (hp: HutangPiutang) => {
    setSelectedHP(hp)
    setFormOpen(true)
  }

  const buildColumns = (tipe: "hutang" | "piutang"): ColumnDef<HutangPiutang>[] => [
    {
      accessorKey: "tanggal",
      header: "Tanggal",
      cell: ({ row }) => formatTanggal(row.original.tanggal),
    },
    {
      id: "pihak",
      header: tipe === "piutang" ? "Pelanggan" : "Supplier",
      cell: ({ row }) =>
        row.original.pelanggan?.nama ?? row.original.supplier?.nama ?? "-",
    },
    {
      accessorKey: "nominal",
      header: "Nominal",
      cell: ({ row }) => (
        <span className="tabular-nums">{formatRupiah(row.original.nominal)}</span>
      ),
    },
    {
      accessorKey: "terbayar",
      header: "Terbayar",
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {formatRupiah(row.original.terbayar)}
        </span>
      ),
    },
    {
      id: "sisa",
      header: "Sisa",
      cell: ({ row }) => (
        <span
          className={cn(
            "tabular-nums font-medium",
            row.original.sisa > 0 ? "text-destructive" : "text-green-600"
          )}
        >
          {formatRupiah(row.original.sisa)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status as StatusBayar
        return <Badge variant={STATUS_BAYAR_VARIANT[s]}>{STATUS_BAYAR_LABEL[s]}</Badge>
      },
    },
    {
      id: "aksi",
      header: "Aksi",
      cell: ({ row }) =>
        row.original.status !== "lunas" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBayar(row.original)}
          >
            <Banknote className="h-4 w-4 mr-1.5" />
            Bayar
          </Button>
        ) : null,
    },
  ]

  const mobileCard = (hp: HutangPiutang) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-base leading-tight">
              {hp.pelanggan?.nama ?? hp.supplier?.nama ?? "-"}
            </p>
            <p className="text-muted-foreground text-sm mt-0.5">
              {formatTanggal(hp.tanggal)}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
              <Badge variant={STATUS_BAYAR_VARIANT[hp.status as StatusBayar]} className="text-xs">
                {STATUS_BAYAR_LABEL[hp.status as StatusBayar]}
              </Badge>
              <span className="text-sm tabular-nums">
                Nominal: <span className="font-medium">{formatRupiah(hp.nominal)}</span>
              </span>
              {hp.sisa > 0 && (
                <span className="text-sm text-destructive tabular-nums font-medium">
                  Sisa: {formatRupiah(hp.sisa)}
                </span>
              )}
            </div>
          </div>
          {hp.status !== "lunas" && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => handleBayar(hp)}
            >
              <Banknote className="h-4 w-4 mr-1" />
              Bayar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const FilterPanel = () => showFilter ? (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Tanggal Dari</label>
            <Input type="date" value={tanggalDari} onChange={(e) => setTanggalDari(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Tanggal Sampai</label>
            <Input type="date" value={tanggalSampai} onChange={(e) => setTanggalSampai(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Status</label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "semua")}>
              <SelectTrigger>
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua</SelectItem>
                <SelectItem value="belum_lunas">Belum Bayar</SelectItem>
                <SelectItem value="sebagian">Sebagian</SelectItem>
                <SelectItem value="lunas">Lunas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {hasFilter && (
          <Button variant="ghost" size="sm" className="mt-3 text-muted-foreground" onClick={resetFilter}>
            <X className="h-4 w-4 mr-1.5" />
            Reset Filter
          </Button>
        )}
      </CardContent>
    </Card>
  ) : null

  return (
    <>
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilter((v) => !v)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filter
          {hasFilter && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
              aktif
            </Badge>
          )}
        </Button>
      </div>

      <FilterPanel />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="piutang">
            Piutang
            {piutang.filter((hp) => hp.status !== "lunas").length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                {piutang.filter((hp) => hp.status !== "lunas").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="hutang">
            Hutang
            {hutang.filter((hp) => hp.status !== "lunas").length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                {hutang.filter((hp) => hp.status !== "lunas").length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="piutang" className="space-y-4 mt-4">
          <DataTable
            columns={buildColumns("piutang")}
            data={piutang}
            searchColumn="tanggal"
            searchPlaceholder="Cari tanggal..."
            mobileCard={mobileCard}
            emptyTitle="Belum ada piutang"
            emptyDescription="Piutang akan muncul saat ada penjualan yang belum lunas."
          />
          {totalSisaPiutang > 0 && (
            <div className="flex justify-end">
              <div className="text-sm bg-muted/50 rounded-lg px-4 py-2">
                Total Sisa Piutang:{" "}
                <span className="font-bold tabular-nums text-destructive">
                  {formatRupiah(totalSisaPiutang)}
                </span>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="hutang" className="space-y-4 mt-4">
          <DataTable
            columns={buildColumns("hutang")}
            data={hutang}
            searchColumn="tanggal"
            searchPlaceholder="Cari tanggal..."
            mobileCard={mobileCard}
            emptyTitle="Belum ada hutang"
            emptyDescription="Hutang akan muncul saat ada pembelian yang belum lunas."
          />
          {totalSisaHutang > 0 && (
            <div className="flex justify-end">
              <div className="text-sm bg-muted/50 rounded-lg px-4 py-2">
                Total Sisa Hutang:{" "}
                <span className="font-bold tabular-nums text-destructive">
                  {formatRupiah(totalSisaHutang)}
                </span>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CatatPembayaranForm
        hp={selectedHP}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setSelectedHP(null)
        }}
        onSuccess={() => {
          startTransition(() => router.refresh())
        }}
      />
    </>
  )
}
