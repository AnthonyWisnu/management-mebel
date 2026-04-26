"use client"

import { useState, useTransition, useMemo } from "react"
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
import { AbsensiForm } from "@/components/forms/AbsensiForm"
import { deleteAbsensi } from "@/lib/actions/absensi"
import { formatRupiah, formatTanggal } from "@/lib/utils"
import type { Absensi, Karyawan, TipeShift } from "@/types"

const TIPE_SHIFT_LABEL: Record<TipeShift, string> = {
  setengah_hari: "½ Hari",
  satu_hari: "1 Hari",
  lembur: "Lembur",
}

const TIPE_SHIFT_VARIANT: Record<TipeShift, "default" | "secondary" | "outline"> = {
  setengah_hari: "secondary",
  satu_hari: "default",
  lembur: "outline",
}

interface AbsensiPageClientProps {
  initialData: Absensi[]
  karyawanList: Karyawan[]
  isAdmin: boolean
}

export function AbsensiPageClient({
  initialData,
  karyawanList,
  isAdmin,
}: AbsensiPageClientProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Absensi | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Absensi | null>(null)
  const [isPending, startTransition] = useTransition()

  const [tanggalDari, setTanggalDari] = useState("")
  const [tanggalSampai, setTanggalSampai] = useState("")
  const [karyawanFilter, setKaryawanFilter] = useState("")
  const [tipeShiftFilter, setTipeShiftFilter] = useState("")
  const [showFilter, setShowFilter] = useState(false)

  const karyawanOptions = karyawanList.map((k) => ({ value: k.id, label: k.nama }))
  const hasFilter = tanggalDari || tanggalSampai || karyawanFilter || tipeShiftFilter

  const filtered = useMemo(() => {
    return initialData.filter((a) => {
      if (tanggalDari && a.tanggal < tanggalDari) return false
      if (tanggalSampai && a.tanggal > tanggalSampai) return false
      if (karyawanFilter && a.karyawan_id !== karyawanFilter) return false
      if (tipeShiftFilter && a.tipe_shift !== tipeShiftFilter) return false
      return true
    })
  }, [initialData, tanggalDari, tanggalSampai, karyawanFilter, tipeShiftFilter])

  const resetFilter = () => {
    setTanggalDari("")
    setTanggalSampai("")
    setKaryawanFilter("")
    setTipeShiftFilter("")
  }

  const openCreate = () => {
    setEditTarget(null)
    setFormOpen(true)
  }

  const openEdit = (absensi: Absensi) => {
    setEditTarget(absensi)
    setFormOpen(true)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteAbsensi(deleteTarget.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Absensi berhasil dihapus")
        router.refresh()
      }
      setDeleteTarget(null)
    })
  }

  const columns: ColumnDef<Absensi>[] = [
    {
      accessorKey: "tanggal",
      header: "Tanggal",
      cell: ({ row }) => formatTanggal(row.original.tanggal),
    },
    {
      id: "karyawan",
      header: "Karyawan",
      accessorFn: (row) => row.karyawan?.nama ?? "",
      cell: ({ row }) => row.original.karyawan?.nama ?? "-",
    },
    {
      accessorKey: "tipe_shift",
      header: "Tipe Shift",
      cell: ({ row }) => (
        <Badge variant={TIPE_SHIFT_VARIANT[row.original.tipe_shift]}>
          {TIPE_SHIFT_LABEL[row.original.tipe_shift]}
        </Badge>
      ),
    },
    {
      accessorKey: "nominal",
      header: "Nominal",
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">
          {formatRupiah(row.original.nominal)}
        </span>
      ),
    },
    {
      accessorKey: "catatan",
      header: "Catatan",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.catatan ?? "-"}
        </span>
      ),
    },
    {
      id: "aksi",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => openEdit(row.original)}
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Button>
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

  const mobileCard = (a: Absensi) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-tight">{a.karyawan?.nama ?? "-"}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant={TIPE_SHIFT_VARIANT[a.tipe_shift]} className="text-xs">
                {TIPE_SHIFT_LABEL[a.tipe_shift]}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {formatTanggal(a.tanggal)}
              </Badge>
            </div>
            <p className="font-semibold tabular-nums text-sm mt-2">
              {formatRupiah(a.nominal)}
            </p>
            {a.catatan && (
              <p className="text-muted-foreground text-xs mt-1 line-clamp-1">
                {a.catatan}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => openEdit(a)}
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteTarget(a)}
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

        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Absensi
        </Button>
      </div>

      {showFilter && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <label className="text-sm font-medium">Tipe Shift</label>
                <select
                  value={tipeShiftFilter}
                  onChange={(e) => setTipeShiftFilter(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Semua Tipe</option>
                  <option value="setengah_hari">½ Hari</option>
                  <option value="satu_hari">1 Hari</option>
                  <option value="lembur">Lembur</option>
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
        emptyTitle="Belum ada data absensi"
        emptyDescription="Belum ada catatan absensi yang sesuai filter."
      />

      <AbsensiForm
        open={formOpen}
        onOpenChange={setFormOpen}
        karyawanList={karyawanList}
        absensi={editTarget}
        onSuccess={() => router.refresh()}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Absensi?</AlertDialogTitle>
            <AlertDialogDescription>
              Absensi{" "}
              <span className="font-semibold">
                {deleteTarget?.karyawan?.nama ?? "ini"}
              </span>{" "}
              pada{" "}
              <span className="font-semibold">
                {deleteTarget ? formatTanggal(deleteTarget.tanggal) : ""}
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
