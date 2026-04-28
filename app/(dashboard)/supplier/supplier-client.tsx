"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { type ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2, Plus, Phone, Mail, MapPin } from "lucide-react"
import { toast } from "sonner"
import { DataTable } from "@/components/tables/DataTable"
import { SupplierForm } from "@/components/forms/SupplierForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { deleteSupplier } from "@/lib/actions/supplier"
import type { Supplier } from "@/types"
import type { Role } from "@/types"
import { formatRupiah } from "@/lib/utils"

interface SupplierPageClientProps {
  initialData: Supplier[]
  role: Role
}

export function SupplierPageClient({ initialData, role }: SupplierPageClientProps) {
  const router = useRouter()
  const isAdmin = role === "admin"
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleEdit = (s: Supplier) => {
    setEditing(s)
    setFormOpen(true)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteSupplier(deleteTarget.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Supplier "${deleteTarget.nama}" dihapus`)
        router.refresh()
      }
      setDeleteTarget(null)
    })
  }

  const columns: ColumnDef<Supplier>[] = [
    {
      accessorKey: "nama",
      header: "Nama",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.nama}</span>
      ),
    },
    {
      accessorKey: "alamat",
      header: "Alamat",
      cell: ({ row }) => (
        <span className="text-muted-foreground line-clamp-1">
          {row.original.alamat ?? "-"}
        </span>
      ),
    },
    {
      accessorKey: "no_telp",
      header: "No. Telp",
      cell: ({ row }) => row.original.no_telp ?? "-",
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => row.original.email ?? "-",
    },
    {
      accessorKey: "saldo_kredit",
      header: "Saldo Kredit",
      cell: ({ row }) =>
        row.original.saldo_kredit > 0 ? (
          <span className="text-blue-600 font-medium tabular-nums text-sm">
            {formatRupiah(row.original.saldo_kredit)}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      id: "aksi",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(row.original)}
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {isAdmin && (
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

  const mobileCard = (s: Supplier) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-base leading-tight">{s.nama}</p>
            {s.alamat && (
              <p className="text-muted-foreground text-sm mt-1 flex items-start gap-1.5">
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span className="line-clamp-2">{s.alamat}</span>
              </p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {s.no_telp && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {s.no_telp}
                </span>
              )}
              {s.email && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {s.email}
                </span>
              )}
              {s.saldo_kredit > 0 && (
                <span className="text-sm text-blue-600 font-medium">
                  Kredit: {formatRupiah(s.saldo_kredit)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(s)}
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteTarget(s)}
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
          Tambah Supplier
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={initialData}
        searchColumn="nama"
        searchPlaceholder="Cari nama supplier..."
        mobileCard={mobileCard}
        emptyTitle="Belum ada supplier"
        emptyDescription="Klik 'Tambah Supplier' untuk menambahkan supplier pertama."
      />

      <SupplierForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditing(null)
        }}
        supplier={editing}
        onSuccess={() => router.refresh()}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Supplier?</AlertDialogTitle>
            <AlertDialogDescription>
              Supplier &quot;{deleteTarget?.nama}&quot; akan dihapus. Data yang sudah
              tercatat di transaksi tidak akan terpengaruh.
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
