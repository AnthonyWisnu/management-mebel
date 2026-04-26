"use client"

import { useState, useTransition, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { type ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2, Plus, Filter, X } from "lucide-react"
import { toast } from "sonner"
import { DataTable } from "@/components/tables/DataTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { deletePenjualan } from "@/lib/actions/penjualan"
import { cn, formatRupiah, formatTanggal } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import type { Penjualan, Pelanggan } from "@/types"

interface PenjualanPageClientProps {
  initialData: Penjualan[]
  pelangganList: Pelanggan[]
  isAdmin: boolean
}

export function PenjualanPageClient({
  initialData,
  pelangganList,
  isAdmin,
}: PenjualanPageClientProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<Penjualan | null>(null)
  const [isPending, startTransition] = useTransition()

  const [tanggalDari, setTanggalDari] = useState("")
  const [tanggalSampai, setTanggalSampai] = useState("")
  const [pelangganFilter, setPelangganFilter] = useState("")
  const [showFilter, setShowFilter] = useState(false)

  const pelangganOptions = pelangganList.map((p) => ({ value: p.id, label: p.nama }))
  const hasFilter = tanggalDari || tanggalSampai || pelangganFilter

  const filtered = useMemo(() => {
    return initialData.filter((p) => {
      if (tanggalDari && p.tanggal < tanggalDari) return false
      if (tanggalSampai && p.tanggal > tanggalSampai) return false
      if (pelangganFilter && p.pelanggan_id !== pelangganFilter) return false
      return true
    })
  }, [initialData, tanggalDari, tanggalSampai, pelangganFilter])

  const resetFilter = () => {
    setTanggalDari("")
    setTanggalSampai("")
    setPelangganFilter("")
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deletePenjualan(deleteTarget.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Penjualan berhasil dihapus")
        router.refresh()
      }
      setDeleteTarget(null)
    })
  }

  const columns: ColumnDef<Penjualan>[] = [
    {
      accessorKey: "no_faktur",
      header: "No. Faktur",
      cell: ({ row }) => (
        <span className="font-medium font-mono text-sm">
          {row.original.no_faktur ?? "-"}
        </span>
      ),
    },
    {
      accessorKey: "tanggal",
      header: "Tanggal",
      cell: ({ row }) => formatTanggal(row.original.tanggal),
    },
    {
      id: "pelanggan",
      header: "Pelanggan",
      cell: ({ row }) => row.original.pelanggan?.nama ?? "-",
    },
    {
      accessorKey: "total_penjualan",
      header: "Total Penjualan",
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">
          {formatRupiah(row.original.total_penjualan)}
        </span>
      ),
    },
    ...(isAdmin
      ? ([
          {
            accessorKey: "total_hpp",
            header: "Total HPP",
            cell: ({ row }: { row: { original: Penjualan } }) => (
              <span className="tabular-nums text-muted-foreground">
                {formatRupiah(row.original.total_hpp)}
              </span>
            ),
          },
          {
            accessorKey: "profit",
            header: "Profit",
            cell: ({ row }: { row: { original: Penjualan } }) => (
              <span
                className={cn(
                  "font-medium tabular-nums",
                  row.original.profit >= 0 ? "text-green-600" : "text-destructive"
                )}
              >
                {formatRupiah(row.original.profit)}
              </span>
            ),
          },
        ] as ColumnDef<Penjualan>[])
      : []),
    {
      id: "aksi",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/penjualan/${row.original.id}/edit`}
            className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteTarget(row.original)}
              aria-label="Hapus"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  const mobileCard = (p: Penjualan) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-sm font-semibold leading-tight">
              {p.no_faktur ?? "—"}
            </p>
            <p className="text-muted-foreground text-sm mt-0.5">
              {p.pelanggan?.nama ?? "-"}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
              <Badge variant="outline" className="text-xs">
                {formatTanggal(p.tanggal)}
              </Badge>
              <span className="font-semibold tabular-nums text-sm">
                {formatRupiah(p.total_penjualan)}
              </span>
              {isAdmin && (
                <span
                  className={cn(
                    "text-xs font-medium tabular-nums",
                    p.profit >= 0 ? "text-green-600" : "text-destructive"
                  )}
                >
                  Profit: {formatRupiah(p.profit)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href={`/penjualan/${p.id}/edit`}
              className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Link>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteTarget(p)}
                aria-label="Hapus"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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

        <Link href="/penjualan/baru" className={cn(buttonVariants())}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Penjualan
        </Link>
      </div>

      {showFilter && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Tanggal Dari</label>
                <Input
                  type="date"
                  value={tanggalDari}
                  onChange={(e) => setTanggalDari(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Tanggal Sampai</label>
                <Input
                  type="date"
                  value={tanggalSampai}
                  onChange={(e) => setTanggalSampai(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Pelanggan</label>
                <SearchableSelect
                  options={pelangganOptions}
                  value={pelangganFilter}
                  onChange={setPelangganFilter}
                  placeholder="Semua pelanggan"
                  searchPlaceholder="Cari pelanggan..."
                  emptyText="Pelanggan tidak ditemukan"
                />
              </div>
            </div>
            {hasFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 text-muted-foreground"
                onClick={resetFilter}
              >
                <X className="h-4 w-4 mr-1.5" />
                Reset Filter
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <DataTable
        columns={columns}
        data={filtered}
        searchColumn="no_faktur"
        searchPlaceholder="Cari no. faktur..."
        mobileCard={mobileCard}
        emptyTitle="Belum ada data penjualan"
        emptyDescription="Belum ada transaksi penjualan yang sesuai filter."
      />

      {isAdmin && (
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Transaksi Penjualan?</AlertDialogTitle>
              <AlertDialogDescription>
                Penjualan dengan no. faktur{" "}
                <span className="font-mono font-semibold">
                  {deleteTarget?.no_faktur ?? "—"}
                </span>{" "}
                akan dihapus. Aksi ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isPending ? "Menghapus..." : "Ya, Hapus"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}
