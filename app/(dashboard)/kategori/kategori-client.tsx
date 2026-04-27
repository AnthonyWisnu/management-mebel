"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { type ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"
import { DataTable } from "@/components/tables/DataTable"
import { KategoriForm } from "@/components/forms/KategoriForm"
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
import { deleteKategori } from "@/lib/actions/kategori"
import type { KategoriProduk } from "@/types"
import type { Role } from "@/types"

interface KategoriPageClientProps {
  initialData: KategoriProduk[]
  role: Role
}

export function KategoriPageClient({ initialData, role }: KategoriPageClientProps) {
  const router = useRouter()
  const isAdmin = role === "admin"
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<KategoriProduk | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<KategoriProduk | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleEdit = (k: KategoriProduk) => {
    setEditing(k)
    setFormOpen(true)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteKategori(deleteTarget.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Kategori "${deleteTarget.nama}" dihapus`)
        router.refresh()
      }
      setDeleteTarget(null)
    })
  }

  const columns: ColumnDef<KategoriProduk>[] = [
    {
      accessorKey: "nama",
      header: "Nama",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.nama}</span>
      ),
    },
    {
      accessorKey: "deskripsi",
      header: "Deskripsi",
      cell: ({ row }) => (
        <span className="text-muted-foreground line-clamp-1">
          {row.original.deskripsi ?? "-"}
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

  const mobileCard = (k: KategoriProduk) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-base leading-tight">{k.nama}</p>
            {k.deskripsi && (
              <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{k.deskripsi}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(k)}
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
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
          Tambah Kategori
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={initialData}
        searchColumn="nama"
        searchPlaceholder="Cari nama kategori..."
        mobileCard={mobileCard}
        emptyTitle="Belum ada kategori"
        emptyDescription="Klik 'Tambah Kategori' untuk menambahkan kategori produk pertama."
      />

      <KategoriForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditing(null)
        }}
        kategori={editing}
        onSuccess={() => router.refresh()}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
            <AlertDialogDescription>
              Kategori &quot;{deleteTarget?.nama}&quot; akan dihapus. Produk yang sudah
              menggunakan kategori ini tidak akan terpengaruh.
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
