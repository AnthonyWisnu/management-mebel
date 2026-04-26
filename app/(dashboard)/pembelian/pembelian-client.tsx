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
import { deletePembelian } from "@/lib/actions/pembelian"
import { cn, formatRupiah, formatTanggal } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import type { Pembelian, Supplier } from "@/types"

interface PembelianPageClientProps {
  initialData: Pembelian[]
  suppliers: Supplier[]
}

export function PembelianPageClient({
  initialData,
  suppliers,
}: PembelianPageClientProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<Pembelian | null>(null)
  const [isPending, startTransition] = useTransition()

  const [tanggalDari, setTanggalDari] = useState("")
  const [tanggalSampai, setTanggalSampai] = useState("")
  const [supplierFilter, setSupplierFilter] = useState("")
  const [showFilter, setShowFilter] = useState(false)

  const supplierOptions = suppliers.map((s) => ({ value: s.id, label: s.nama }))

  const hasFilter = tanggalDari || tanggalSampai || supplierFilter

  const filtered = useMemo(() => {
    return initialData.filter((p) => {
      if (tanggalDari && p.tanggal < tanggalDari) return false
      if (tanggalSampai && p.tanggal > tanggalSampai) return false
      if (supplierFilter && p.supplier_id !== supplierFilter) return false
      return true
    })
  }, [initialData, tanggalDari, tanggalSampai, supplierFilter])

  const resetFilter = () => {
    setTanggalDari("")
    setTanggalSampai("")
    setSupplierFilter("")
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deletePembelian(deleteTarget.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Pembelian berhasil dihapus")
        router.refresh()
      }
      setDeleteTarget(null)
    })
  }

  const columns: ColumnDef<Pembelian>[] = [
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
      id: "supplier",
      header: "Supplier",
      cell: ({ row }) => row.original.supplier?.nama ?? "-",
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">
          {formatRupiah(row.original.total)}
        </span>
      ),
    },
    {
      id: "aksi",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/pembelian/${row.original.id}/edit`}
            className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteTarget(row.original)}
            aria-label="Hapus"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const mobileCard = (p: Pembelian) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-sm font-semibold leading-tight">
              {p.no_faktur ?? "—"}
            </p>
            <p className="text-muted-foreground text-sm mt-0.5">
              {p.supplier?.nama ?? "-"}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="outline" className="text-xs">
                {formatTanggal(p.tanggal)}
              </Badge>
              <span className="font-semibold tabular-nums text-sm">
                {formatRupiah(p.total)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href={`/pembelian/${p.id}/edit`}
              className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteTarget(p)}
              aria-label="Hapus"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
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

        <Link href="/pembelian/baru" className={cn(buttonVariants())}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Pembelian
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
                <label className="text-sm font-medium">Supplier</label>
                <SearchableSelect
                  options={supplierOptions}
                  value={supplierFilter}
                  onChange={setSupplierFilter}
                  placeholder="Semua supplier"
                  searchPlaceholder="Cari supplier..."
                  emptyText="Supplier tidak ditemukan"
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
        emptyTitle="Belum ada data pembelian"
        emptyDescription="Belum ada transaksi pembelian yang sesuai filter."
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi Pembelian?</AlertDialogTitle>
            <AlertDialogDescription>
              Pembelian dengan no. faktur{" "}
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
    </>
  )
}
