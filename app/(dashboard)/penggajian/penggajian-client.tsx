"use client"

import { useState, useTransition, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { type ColumnDef } from "@tanstack/react-table"
import { Eye, Trash2, Zap, Plus, Filter, X } from "lucide-react"
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
import { GeneratePenggajianForm } from "@/components/forms/GeneratePenggajianForm"
import { PenggajianManualForm } from "@/components/forms/PenggajianManualForm"
import { deletePenggajian } from "@/lib/actions/penggajian"
import { cn, formatRupiah, formatTanggal } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import type { Penggajian, Karyawan, StatusPenggajian } from "@/types"

const STATUS_VARIANT: Record<StatusPenggajian, "secondary" | "default"> = {
  draft: "secondary",
  dibayar: "default",
}
const STATUS_LABEL: Record<StatusPenggajian, string> = {
  draft: "Draft",
  dibayar: "Dibayar",
}

function fmtPeriode(mulai: string, selesai: string) {
  return `${formatTanggal(mulai)} – ${formatTanggal(selesai)}`
}

interface PenggajianPageClientProps {
  initialData: Penggajian[]
  karyawanList: Karyawan[]
  isAdmin: boolean
}

export function PenggajianPageClient({
  initialData,
  karyawanList,
  isAdmin,
}: PenggajianPageClientProps) {
  const router = useRouter()
  const [generateOpen, setGenerateOpen] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Penggajian | null>(null)
  const [isPending, startTransition] = useTransition()

  const [periodeFilter, setPeriodeFilter] = useState("")
  const [karyawanFilter, setKaryawanFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [showFilter, setShowFilter] = useState(false)

  const karyawanOptions = karyawanList.map((k) => ({ value: k.id, label: k.nama }))
  const hasFilter = periodeFilter || karyawanFilter || statusFilter

  const filtered = useMemo(() => {
    return initialData.filter((p) => {
      if (periodeFilter && p.periode_mulai > periodeFilter && p.periode_selesai < periodeFilter)
        return false
      if (karyawanFilter && p.karyawan_id !== karyawanFilter) return false
      if (statusFilter && p.status !== statusFilter) return false
      return true
    })
  }, [initialData, periodeFilter, karyawanFilter, statusFilter])

  const resetFilter = () => {
    setPeriodeFilter("")
    setKaryawanFilter("")
    setStatusFilter("")
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deletePenggajian(deleteTarget.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Penggajian berhasil dihapus")
        router.refresh()
      }
      setDeleteTarget(null)
    })
  }

  const columns: ColumnDef<Penggajian>[] = [
    {
      id: "periode",
      header: "Periode",
      accessorFn: (row) => row.periode_mulai,
      cell: ({ row }) =>
        fmtPeriode(row.original.periode_mulai, row.original.periode_selesai),
    },
    {
      id: "karyawan",
      header: "Karyawan",
      accessorFn: (row) => row.karyawan?.nama ?? "",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.karyawan?.nama ?? "-"}</span>
      ),
    },
    {
      accessorKey: "total_gaji_kalkulasi",
      header: "Total Kalkulasi",
      cell: ({ row }) => (
        <span className="tabular-nums">{formatRupiah(row.original.total_gaji_kalkulasi)}</span>
      ),
    },
    {
      accessorKey: "total_dibayar",
      header: "Total Dibayar",
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">
          {formatRupiah(row.original.total_dibayar)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANT[row.original.status]}>
          {STATUS_LABEL[row.original.status]}
        </Badge>
      ),
    },
    {
      id: "aksi",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/penggajian/${row.original.id}`}
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
            aria-label="Detail"
          >
            <Eye className="h-4 w-4" />
          </Link>
          {isAdmin && row.original.status === "draft" && (
            <Button
              variant="ghost"
              size="icon"
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

  const mobileCard = (p: Penggajian) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-tight">{p.karyawan?.nama ?? "-"}</p>
            <p className="text-muted-foreground text-sm mt-0.5">
              {fmtPeriode(p.periode_mulai, p.periode_selesai)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={STATUS_VARIANT[p.status]} className="text-xs">
                {STATUS_LABEL[p.status]}
              </Badge>
              <span className="font-semibold tabular-nums text-sm">
                {formatRupiah(p.total_dibayar)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href={`/penggajian/${p.id}`}
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
              aria-label="Detail"
            >
              <Eye className="h-4 w-4" />
            </Link>
            {isAdmin && p.status === "draft" && (
              <Button
                variant="ghost"
                size="icon"
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

        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setManualOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Manual
            </Button>
            <Button onClick={() => setGenerateOpen(true)}>
              <Zap className="h-4 w-4 mr-2" />
              Generate Penggajian
            </Button>
          </div>
        )}
      </div>

      {showFilter && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Periode (mulai dari)</label>
                <Input
                  type="date"
                  value={periodeFilter}
                  onChange={(e) => setPeriodeFilter(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Karyawan</label>
                <SearchableSelect
                  options={karyawanOptions}
                  value={karyawanFilter}
                  onChange={setKaryawanFilter}
                  placeholder="Semua karyawan"
                  searchPlaceholder="Cari karyawan..."
                  emptyText="Karyawan tidak ditemukan"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Semua Status</option>
                  <option value="draft">Draft</option>
                  <option value="dibayar">Dibayar</option>
                </select>
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
        searchColumn="karyawan"
        searchPlaceholder="Cari karyawan..."
        mobileCard={mobileCard}
        emptyTitle="Belum ada data penggajian"
        emptyDescription="Belum ada slip gaji yang sesuai filter."
      />

      {isAdmin && (
        <>
          <GeneratePenggajianForm
            open={generateOpen}
            onOpenChange={setGenerateOpen}
            onSuccess={() => router.refresh()}
          />
          <PenggajianManualForm
            open={manualOpen}
            onOpenChange={setManualOpen}
            karyawanList={karyawanList}
            onSuccess={() => router.refresh()}
          />
        </>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Penggajian?</AlertDialogTitle>
            <AlertDialogDescription>
              Slip gaji{" "}
              <span className="font-semibold">{deleteTarget?.karyawan?.nama}</span>{" "}
              periode{" "}
              {deleteTarget &&
                fmtPeriode(deleteTarget.periode_mulai, deleteTarget.periode_selesai)}{" "}
              akan dihapus permanen. Hanya penggajian berstatus draft yang dapat dihapus.
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
