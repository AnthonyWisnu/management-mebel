"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { type ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2, Plus, Phone, MapPin } from "lucide-react"
import { toast } from "sonner"
import { DataTable } from "@/components/tables/DataTable"
import { KaryawanForm } from "@/components/forms/KaryawanForm"
import { Button } from "@/components/ui/button"
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
import { deleteKaryawan } from "@/lib/actions/karyawan"
import { formatRupiah, formatTanggal } from "@/lib/utils"
import type { Karyawan } from "@/types"
import type { Role } from "@/types"

interface KaryawanPageClientProps {
  initialData: Karyawan[]
  role: Role
}

export function KaryawanPageClient({ initialData, role }: KaryawanPageClientProps) {
  const router = useRouter()
  const isAdmin = role === "admin"
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Karyawan | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Karyawan | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleEdit = (k: Karyawan) => {
    setEditing(k)
    setFormOpen(true)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteKaryawan(deleteTarget.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Karyawan "${deleteTarget.nama}" dihapus`)
        router.refresh()
      }
      setDeleteTarget(null)
    })
  }

  const columns: ColumnDef<Karyawan>[] = [
    {
      accessorKey: "nama",
      header: "Nama",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.nama}</p>
          {row.original.jabatan && (
            <p className="text-xs text-muted-foreground">{row.original.jabatan}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "no_telp",
      header: "No. Telp",
      cell: ({ row }) => row.original.no_telp ?? "-",
    },
    {
      id: "gaji",
      header: "Gaji / Hari",
      cell: ({ row }) => (
        <span className="text-sm">{formatRupiah(row.original.gaji_satu_hari)}</span>
      ),
    },
    {
      accessorKey: "aktif",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.aktif ? "default" : "secondary"}>
          {row.original.aktif ? "Aktif" : "Nonaktif"}
        </Badge>
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
            onClick={() => handleEdit(row.original)}
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

  const mobileCard = (k: Karyawan) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-base leading-tight">{k.nama}</p>
              <Badge variant={k.aktif ? "default" : "secondary"} className="text-xs">
                {k.aktif ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>
            {k.jabatan && (
              <p className="text-muted-foreground text-sm mt-0.5">{k.jabatan}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {k.no_telp && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {k.no_telp}
                </span>
              )}
              {k.alamat && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="line-clamp-1">{k.alamat}</span>
                </span>
              )}
            </div>
            <div className="flex gap-4 mt-2 text-sm">
              <span className="text-muted-foreground">
                1/2 hari: <span className="text-foreground font-medium">{formatRupiah(k.gaji_setengah_hari)}</span>
              </span>
              <span className="text-muted-foreground">
                1 hari: <span className="text-foreground font-medium">{formatRupiah(k.gaji_satu_hari)}</span>
              </span>
            </div>
            {k.tanggal_bergabung && (
              <p className="text-xs text-muted-foreground mt-1">
                Bergabung: {formatTanggal(k.tanggal_bergabung)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleEdit(k)}
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteTarget(k)}
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
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Karyawan
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={initialData}
        searchColumn="nama"
        searchPlaceholder="Cari nama karyawan..."
        mobileCard={mobileCard}
        emptyTitle="Belum ada karyawan"
        emptyDescription="Klik 'Tambah Karyawan' untuk menambahkan karyawan pertama."
      />

      <KaryawanForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditing(null)
        }}
        karyawan={editing}
        onSuccess={() => router.refresh()}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Karyawan?</AlertDialogTitle>
            <AlertDialogDescription>
              Karyawan &quot;{deleteTarget?.nama}&quot; akan dihapus. Data absensi
              dan penggajian yang sudah tercatat tidak akan terpengaruh.
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
