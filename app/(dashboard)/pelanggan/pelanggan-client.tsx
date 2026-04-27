"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { type ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2, Plus, Phone, Mail, MapPin } from "lucide-react"
import { toast } from "sonner"
import { DataTable } from "@/components/tables/DataTable"
import { PelangganForm } from "@/components/forms/PelangganForm"
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
import { deletePelanggan } from "@/lib/actions/pelanggan"
import type { Pelanggan } from "@/types"
import type { Role } from "@/types"

interface PelangganPageClientProps {
  initialData: Pelanggan[]
  role: Role
}

export function PelangganPageClient({ initialData, role }: PelangganPageClientProps) {
  const router = useRouter()
  const isAdmin = role === "admin"
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Pelanggan | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Pelanggan | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleEdit = (p: Pelanggan) => {
    setEditing(p)
    setFormOpen(true)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deletePelanggan(deleteTarget.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Pelanggan "${deleteTarget.nama}" dihapus`)
        router.refresh()
      }
      setDeleteTarget(null)
    })
  }

  const columns: ColumnDef<Pelanggan>[] = [
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

  const mobileCard = (p: Pelanggan) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-base leading-tight">{p.nama}</p>
            {p.alamat && (
              <p className="text-muted-foreground text-sm mt-1 flex items-start gap-1.5">
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span className="line-clamp-2">{p.alamat}</span>
              </p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {p.no_telp && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {p.no_telp}
                </span>
              )}
              {p.email && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {p.email}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(p)}
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {isAdmin && (
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
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Pelanggan
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={initialData}
        searchColumn="nama"
        searchPlaceholder="Cari nama pelanggan..."
        mobileCard={mobileCard}
        emptyTitle="Belum ada pelanggan"
        emptyDescription="Klik 'Tambah Pelanggan' untuk menambahkan pelanggan pertama."
      />

      <PelangganForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditing(null)
        }}
        pelanggan={editing}
        onSuccess={() => router.refresh()}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pelanggan?</AlertDialogTitle>
            <AlertDialogDescription>
              Pelanggan &quot;{deleteTarget?.nama}&quot; akan dihapus. Data yang sudah
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
