"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { type ColumnDef } from "@tanstack/react-table"
import { Pencil, UserCheck, UserX, Plus } from "lucide-react"
import { toast } from "sonner"
import { DataTable } from "@/components/tables/DataTable"
import { UserForm } from "@/components/forms/UserForm"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { toggleUserActive } from "@/lib/actions/users"
import type { UserRow } from "@/lib/actions/users"
import { formatTanggal } from "@/lib/utils"

interface UsersPageClientProps {
  initialUsers: UserRow[]
}

export function UsersPageClient({ initialUsers }: UsersPageClientProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRow | null>(null)
  const [toggleTarget, setToggleTarget] = useState<UserRow | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleEdit = (user: UserRow) => {
    setEditingUser(user)
    setFormOpen(true)
  }

  const handleToggleActive = (user: UserRow) => {
    setToggleTarget(user)
  }

  const confirmToggle = () => {
    if (!toggleTarget) return
    startTransition(async () => {
      const result = await toggleUserActive(toggleTarget.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(
          toggleTarget.aktif
            ? `${toggleTarget.nama ?? "User"} dinonaktifkan`
            : `${toggleTarget.nama ?? "User"} diaktifkan`
        )
        router.refresh()
      }
      setToggleTarget(null)
    })
  }

  const columns: ColumnDef<UserRow>[] = [
    {
      accessorKey: "nama",
      header: "Nama",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.nama ?? "-"}</span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant={row.original.role === "admin" ? "default" : "secondary"}>
          {row.original.role}
        </Badge>
      ),
    },
    {
      accessorKey: "aktif",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.aktif ? "default" : "destructive"}>
          {row.original.aktif ? "Aktif" : "Nonaktif"}
        </Badge>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Dibuat",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {formatTanggal(row.original.created_at)}
        </span>
      ),
    },
    {
      id: "aksi",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleEdit(row.original)}
            aria-label="Edit user"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleToggleActive(row.original)}
            aria-label={row.original.aktif ? "Nonaktifkan user" : "Aktifkan user"}
            className={
              row.original.aktif
                ? "text-destructive hover:text-destructive"
                : "text-green-600 hover:text-green-700"
            }
          >
            {row.original.aktif ? (
              <UserX className="h-4 w-4" />
            ) : (
              <UserCheck className="h-4 w-4" />
            )}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditingUser(null)
            setFormOpen(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah User
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={initialUsers}
        searchColumn="nama"
        searchPlaceholder="Cari nama atau email..."
        emptyTitle="Belum ada pengguna"
        emptyDescription="Klik 'Tambah Pengguna' untuk menambahkan akun pertama."
      />

      <UserForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingUser(null)
        }}
        user={editingUser}
        onSuccess={() => router.refresh()}
      />

      <AlertDialog
        open={!!toggleTarget}
        onOpenChange={(open) => !open && setToggleTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.aktif ? "Nonaktifkan User?" : "Aktifkan User?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.aktif
                ? `User "${toggleTarget?.nama ?? toggleTarget?.email}" tidak akan bisa login setelah dinonaktifkan.`
                : `User "${toggleTarget?.nama ?? toggleTarget?.email}" akan dapat login kembali.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggle} disabled={isPending}>
              {isPending ? "Memproses..." : "Ya, lanjutkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
