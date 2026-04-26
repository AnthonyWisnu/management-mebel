"use client"

import dynamic from "next/dynamic"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Download, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { updatePenggajian, tandaiDibayar } from "@/lib/actions/penggajian"
import { SlipGajiPDF } from "@/components/pdf/SlipGajiPDF"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatRupiah, formatTanggal } from "@/lib/utils"
import type { Penggajian, TipeShift } from "@/types"

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFDownloadLink),
  { ssr: false, loading: () => <Button variant="outline" size="sm" disabled><Loader2 className="h-4 w-4 mr-2 animate-spin" />PDF...</Button> }
)

const TIPE_SHIFT_LABEL: Record<TipeShift, string> = {
  setengah_hari: "½ Hari",
  satu_hari: "1 Hari",
  lembur: "Lembur",
}

interface PenggajianDetailClientProps {
  penggajian: Penggajian
  isAdmin: boolean
}

export function PenggajianDetailClient({
  penggajian,
  isAdmin,
}: PenggajianDetailClientProps) {
  const router = useRouter()
  const [totalDibayar, setTotalDibayar] = useState(penggajian.total_dibayar)
  const [catatan, setCatatan] = useState(penggajian.catatan ?? "")
  const [isSaving, startSave] = useTransition()
  const [isMarking, startMark] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const isDraft = penggajian.status === "draft"
  const isEditable = isAdmin && isDraft
  const absensiList = penggajian.absensi ?? []

  const handleSave = () => {
    startSave(async () => {
      const result = await updatePenggajian(penggajian.id, {
        total_dibayar: totalDibayar,
        catatan,
      })
      if (result.error) toast.error(result.error)
      else {
        toast.success("Perubahan disimpan")
        router.refresh()
      }
    })
  }

  const handleTandaiDibayar = () => {
    startMark(async () => {
      const result = await tandaiDibayar(penggajian.id)
      if (result.error) toast.error(result.error)
      else {
        toast.success("Slip gaji ditandai sebagai dibayar")
        router.refresh()
      }
      setConfirmOpen(false)
    })
  }

  const pdfFileName = `slip-gaji-${penggajian.karyawan?.nama ?? "karyawan"}-${penggajian.periode_mulai}.pdf`
    .toLowerCase()
    .replace(/\s+/g, "-")

  return (
    <div className="space-y-6">
      {/* Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Karyawan</p>
            <p className="font-semibold mt-1">{penggajian.karyawan?.nama ?? "-"}</p>
            <p className="text-xs text-muted-foreground">{penggajian.karyawan?.jabatan ?? "-"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Periode</p>
            <p className="font-semibold mt-1 text-sm">
              {formatTanggal(penggajian.periode_mulai)}
            </p>
            <p className="text-xs text-muted-foreground">
              s/d {formatTanggal(penggajian.periode_selesai)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Status</p>
            <div className="mt-1">
              <Badge variant={penggajian.status === "dibayar" ? "default" : "secondary"}>
                {penggajian.status === "dibayar" ? "Dibayar" : "Draft"}
              </Badge>
            </div>
            {penggajian.tanggal_bayar && (
              <p className="text-xs text-muted-foreground mt-1">
                {formatTanggal(penggajian.tanggal_bayar)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Kalkulasi</p>
            <p className="font-semibold mt-1 tabular-nums">
              {formatRupiah(penggajian.total_gaji_kalkulasi)}
            </p>
            <p className="text-xs text-muted-foreground">{absensiList.length} absensi</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabel Rincian Absensi */}
      {absensiList.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Rincian Kehadiran</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Tipe Shift</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {absensiList.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{formatTanggal(a.tanggal)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {TIPE_SHIFT_LABEL[a.tipe_shift]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatRupiah(a.nominal)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell colSpan={2}>Total Kalkulasi</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatRupiah(penggajian.total_gaji_kalkulasi)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Form Total Dibayar + Catatan */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pembayaran</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Total Dibayar (Rp)
              {isEditable && (
                <span className="text-muted-foreground font-normal ml-2 text-xs">
                  — dapat di-override
                </span>
              )}
            </label>
            <Input
              type="number"
              min={0}
              value={totalDibayar}
              onChange={(e) => setTotalDibayar(Number(e.target.value))}
              disabled={!isEditable || isSaving}
              className="max-w-xs tabular-nums"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Catatan</label>
            <Textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              disabled={!isEditable || isSaving}
              placeholder="Catatan tambahan..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {isEditable && (
              <>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSaving ? "Menyimpan..." : "Simpan Draft"}
                </Button>
                <Button
                  variant="outline"
                  className="text-green-700 border-green-300 hover:bg-green-50"
                  onClick={() => setConfirmOpen(true)}
                  disabled={isMarking}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Tandai Dibayar
                </Button>
              </>
            )}

            <PDFDownloadLink
              document={<SlipGajiPDF penggajian={{ ...penggajian, absensi: absensiList, total_dibayar: totalDibayar, catatan: catatan || null }} />}
              fileName={pdfFileName}
            >
              {({ loading }) => (
                <Button variant="outline" size="sm" disabled={loading} className="h-9">
                  {loading
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Memuat...</>
                    : <><Download className="h-4 w-4 mr-2" />Cetak Slip Gaji</>
                  }
                </Button>
              )}
            </PDFDownloadLink>
          </div>
        </CardContent>
      </Card>

      {/* Confirm Tandai Dibayar */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tandai sebagai Dibayar?</AlertDialogTitle>
            <AlertDialogDescription>
              Slip gaji{" "}
              <span className="font-semibold">{penggajian.karyawan?.nama}</span> akan
              ditandai sebagai sudah dibayar (
              <span className="font-semibold">{formatRupiah(totalDibayar)}</span>). Status
              tidak dapat dikembalikan ke draft.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTandaiDibayar}
              disabled={isMarking}
              className="bg-green-700 hover:bg-green-800 text-white"
            >
              {isMarking ? "Memproses..." : "Ya, Tandai Dibayar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
