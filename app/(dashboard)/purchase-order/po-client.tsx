"use client"

import { useState, useTransition, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { type ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2, Plus, Filter, X, Clock, CheckCircle2, CircleDashed, CircleOff } from "lucide-react"
import { toast } from "sonner"
import { DataTable } from "@/components/tables/DataTable"
import { Button, buttonVariants } from "@/components/ui/button"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { deletePurchaseOrder, updatePOStatus } from "@/lib/actions/purchase-order"
import { cn, formatRupiah, formatTanggal } from "@/lib/utils"
import type { PurchaseOrder, StatusPO, Pelanggan } from "@/types"

// ── Deadline helper ──────────────────────────────────────────
function getDeadlineInfo(batasWaktu: string, status: StatusPO) {
  if (status === "selesai" || status === "dibatalkan") return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadline = new Date(batasWaktu)
  deadline.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { label: `${Math.abs(diffDays)}h terlambat`, variant: "destructive" as const }
  if (diffDays === 0) return { label: "Hari ini!", variant: "destructive" as const }
  if (diffDays <= 3) return { label: `${diffDays}h lagi`, variant: "secondary" as const }
  return { label: `${diffDays}h lagi`, variant: "outline" as const }
}

// ── Status config ────────────────────────────────────────────
const STATUS_LABEL: Record<StatusPO, string> = {
  pending:      "Pending",
  dalam_proses: "Dalam Proses",
  selesai:      "Selesai",
  dibatalkan:   "Dibatalkan",
}

const STATUS_VARIANT: Record<StatusPO, "default" | "secondary" | "outline" | "destructive"> = {
  pending:      "outline",
  dalam_proses: "secondary",
  selesai:      "default",
  dibatalkan:   "destructive",
}

const STATUS_ICON: Record<StatusPO, React.ReactNode> = {
  pending:      <CircleDashed className="h-3 w-3" />,
  dalam_proses: <Clock className="h-3 w-3" />,
  selesai:      <CheckCircle2 className="h-3 w-3" />,
  dibatalkan:   <CircleOff className="h-3 w-3" />,
}

const ALL_STATUS: StatusPO[] = ["pending", "dalam_proses", "selesai", "dibatalkan"]

// ── Inline status select ─────────────────────────────────────
function InlineStatusSelect({
  po,
  onChanged,
}: {
  po: PurchaseOrder
  onChanged: () => void
}) {
  const [pending, startTransition] = useTransition()

  const handleChange = (newStatus: string | null) => {
    if (!newStatus || newStatus === po.status) return
    startTransition(async () => {
      const result = await updatePOStatus(po.id, newStatus as StatusPO)
      if (result.error) {
        toast.error("Gagal mengubah status")
      } else {
        toast.success(`Status diubah ke "${STATUS_LABEL[newStatus as StatusPO]}"`)
        onChanged()
      }
    })
  }

  return (
    <Select value={po.status} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger className="w-[140px] h-8 text-xs">
        <SelectValue>
          <span className="flex items-center gap-1.5">
            {STATUS_ICON[po.status]}
            {STATUS_LABEL[po.status]}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {ALL_STATUS.map((s) => (
          <SelectItem key={s} value={s} className="text-xs">
            <span className="flex items-center gap-1.5">
              {STATUS_ICON[s]}
              {STATUS_LABEL[s]}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

interface POPageClientProps {
  initialData: PurchaseOrder[]
  pelangganList: Pick<Pelanggan, "id" | "nama">[]
}

export function POPageClient({ initialData, pelangganList }: POPageClientProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null)
  const [isPending, startTransition] = useTransition()

  const [statusFilter, setStatusFilter] = useState<string>("")
  const [pelangganFilter, setPelangganFilter] = useState<string>("")
  const [showFilter, setShowFilter] = useState(false)

  const pelangganOptions = pelangganList.map((p) => ({ value: p.id, label: p.nama }))
  const statusOptions = ALL_STATUS.map((s) => ({ value: s, label: STATUS_LABEL[s] }))
  const hasFilter = statusFilter || pelangganFilter

  const filtered = useMemo(() => {
    return initialData.filter((po) => {
      if (statusFilter && po.status !== statusFilter) return false
      if (pelangganFilter && po.pelanggan_id !== pelangganFilter) return false
      return true
    })
  }, [initialData, statusFilter, pelangganFilter])

  const resetFilter = () => {
    setStatusFilter("")
    setPelangganFilter("")
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deletePurchaseOrder(deleteTarget.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Purchase Order berhasil dihapus")
        router.refresh()
      }
      setDeleteTarget(null)
    })
  }

  const columns: ColumnDef<PurchaseOrder>[] = [
    {
      accessorKey: "no_po",
      header: "No. PO",
      cell: ({ row }) => (
        <span className="font-medium font-mono text-sm">{row.original.no_po}</span>
      ),
    },
    {
      id: "pelanggan",
      header: "Pelanggan",
      cell: ({ row }) => row.original.pelanggan?.nama ?? "-",
    },
    {
      accessorKey: "tanggal_po",
      header: "Tgl. PO",
      cell: ({ row }) => formatTanggal(row.original.tanggal_po),
    },
    {
      accessorKey: "batas_waktu",
      header: "Deadline",
      cell: ({ row }) => {
        const info = getDeadlineInfo(row.original.batas_waktu, row.original.status)
        return (
          <div className="flex flex-col gap-1">
            <span className="text-sm">{formatTanggal(row.original.batas_waktu)}</span>
            {info && (
              <Badge variant={info.variant} className="w-fit text-xs px-1.5 py-0">
                {info.label}
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <InlineStatusSelect po={row.original} onChanged={() => router.refresh()} />
      ),
    },
    {
      accessorKey: "total_estimasi",
      header: "Est. Total",
      cell: ({ row }) => (
        <span className="tabular-nums font-medium">
          {formatRupiah(row.original.total_estimasi)}
        </span>
      ),
    },
    {
      id: "aksi",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/purchase-order/${row.original.id}/edit`}
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
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

  const mobileCard = (po: PurchaseOrder) => {
    const info = getDeadlineInfo(po.batas_waktu, po.status)
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-sm font-semibold">{po.no_po}</p>
              <p className="text-muted-foreground text-sm mt-0.5">
                {po.pelanggan?.nama ?? "-"}
              </p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2">
                <span className="text-xs text-muted-foreground">
                  Deadline: {formatTanggal(po.batas_waktu)}
                </span>
                {info && (
                  <Badge variant={info.variant} className="text-xs px-1.5 py-0">
                    {info.label}
                  </Badge>
                )}
              </div>
              <div className="mt-2">
                <InlineStatusSelect po={po} onChanged={() => router.refresh()} />
              </div>
              <p className="font-semibold tabular-nums text-sm mt-2">
                {formatRupiah(po.total_estimasi)}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Link
                href={`/purchase-order/${po.id}/edit`}
                className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteTarget(po)}
                aria-label="Hapus"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

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
            <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">aktif</Badge>
          )}
        </Button>

        <Link href="/purchase-order/baru" className={cn(buttonVariants())}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah PO
        </Link>
      </div>

      {showFilter && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Status</label>
                <SearchableSelect
                  options={statusOptions}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  placeholder="Semua status"
                  searchPlaceholder="Cari status..."
                  emptyText="Status tidak ditemukan"
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
        searchColumn="no_po"
        searchPlaceholder="Cari no. PO..."
        mobileCard={mobileCard}
        emptyTitle="Belum ada Purchase Order"
        emptyDescription="Tambah PO baru untuk mulai mencatat pesanan masuk."
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Purchase Order?</AlertDialogTitle>
            <AlertDialogDescription>
              PO{" "}
              <span className="font-mono font-semibold">{deleteTarget?.no_po}</span>{" "}
              akan dihapus permanen. Aksi ini tidak dapat dibatalkan.
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
