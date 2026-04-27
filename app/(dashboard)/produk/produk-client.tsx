"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { type ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2, Plus, Package } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { DataTable } from "@/components/tables/DataTable"
import { ProdukForm } from "@/components/forms/ProdukForm"
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
import { deleteProduk } from "@/lib/actions/produk"
import type { Produk, KategoriProduk } from "@/types"
import type { Role } from "@/types"

interface ProdukPageClientProps {
  initialData: Produk[]
  kategoriList: KategoriProduk[]
  role: Role
}

export function ProdukPageClient({ initialData, kategoriList, role }: ProdukPageClientProps) {
  const router = useRouter()
  const isAdmin = role === "admin"
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Produk | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Produk | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleEdit = (p: Produk) => {
    setEditing(p)
    setFormOpen(true)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteProduk(deleteTarget.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Produk "${deleteTarget.nama}" dihapus`)
        router.refresh()
      }
      setDeleteTarget(null)
    })
  }

  const columns: ColumnDef<Produk>[] = [
    {
      id: "foto",
      header: "",
      size: 48,
      cell: ({ row }) => (
        <div className="w-10 h-10 rounded-md overflow-hidden bg-muted flex items-center justify-center shrink-0">
          {row.original.foto_url ? (
            <Image
              src={row.original.foto_url}
              alt={row.original.nama}
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          ) : (
            <Package className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      ),
    },
    {
      accessorKey: "nama",
      header: "Nama",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.nama}</p>
          {row.original.deskripsi && (
            <p className="text-xs text-muted-foreground line-clamp-1">{row.original.deskripsi}</p>
          )}
        </div>
      ),
    },
    {
      id: "kategori",
      header: "Kategori",
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.kategori_produk?.nama ?? "-"}
        </Badge>
      ),
    },
    {
      accessorKey: "satuan",
      header: "Satuan",
      cell: ({ row }) => row.original.satuan,
    },
    {
      accessorKey: "stok",
      header: "Stok",
      cell: ({ row }) => {
        const { stok, satuan } = row.original
        return (
          <span className={stok <= 0 ? "text-destructive font-medium" : ""}>
            {stok} {satuan}
          </span>
        )
      },
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

  const mobileCard = (p: Produk) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center shrink-0">
            {p.foto_url ? (
              <Image
                src={p.foto_url}
                alt={p.nama}
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            ) : (
              <Package className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-base leading-tight">{p.nama}</p>
                {p.deskripsi && (
                  <p className="text-muted-foreground text-sm mt-0.5 line-clamp-2">{p.deskripsi}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="secondary" className="text-xs">
                    {p.kategori_produk?.nama ?? "-"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{p.satuan}</span>
                  <span className={`text-xs font-medium ${p.stok <= 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    Stok: {p.stok}
                  </span>
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
          Tambah Produk
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={initialData}
        searchColumn="nama"
        searchPlaceholder="Cari nama produk..."
        mobileCard={mobileCard}
        emptyTitle="Belum ada produk"
        emptyDescription="Klik 'Tambah Produk' untuk menambahkan produk pertama."
      />

      <ProdukForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditing(null)
        }}
        produk={editing}
        kategoriList={kategoriList}
        onSuccess={() => router.refresh()}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
            <AlertDialogDescription>
              Produk &quot;{deleteTarget?.nama}&quot; akan dihapus. Data yang sudah
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
