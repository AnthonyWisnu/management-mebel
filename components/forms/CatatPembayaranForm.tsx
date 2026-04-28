"use client"

import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { catatPembayaran } from "@/lib/actions/hutang-piutang"
import { CatatPembayaranSchema, type CatatPembayaranInput } from "@/lib/validations/hutang-piutang"
import { formatRupiah } from "@/lib/utils"
import type { HutangPiutang } from "@/types"

interface CatatPembayaranFormProps {
  hp: HutangPiutang | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CatatPembayaranForm({
  hp,
  open,
  onOpenChange,
  onSuccess,
}: CatatPembayaranFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<CatatPembayaranInput>({
    resolver: zodResolver(CatatPembayaranSchema) as unknown as Resolver<CatatPembayaranInput>,
    defaultValues: {
      jumlah: 0,
      tanggal: new Date().toISOString().split("T")[0],
      catatan: "",
    },
  })

  const { formState: { isSubmitting } } = form

  const sisa = hp ? Number(hp.nominal) - Number(hp.terbayar) : 0

  const onSubmit = async (data: CatatPembayaranInput) => {
    if (!hp) return
    setServerError(null)
    const result = await catatPembayaran(hp.id, data)
    if (result.error) {
      setServerError(result.error)
      return
    }
    toast.success("Pembayaran berhasil dicatat")
    form.reset()
    onOpenChange(false)
    onSuccess()
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset()
      setServerError(null)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Catat Pembayaran</DialogTitle>
        </DialogHeader>

        {hp && (
          <div className="rounded-lg border bg-muted/30 p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nominal</span>
              <span className="font-medium tabular-nums">{formatRupiah(hp.nominal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sudah Dibayar</span>
              <span className="tabular-nums">{formatRupiah(hp.terbayar)}</span>
            </div>
            <div className="flex justify-between border-t pt-1">
              <span className="font-semibold">Sisa</span>
              <span className="font-bold tabular-nums text-destructive">{formatRupiah(sisa)}</span>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {serverError}
              </div>
            )}

            <FormField
              control={form.control}
              name="jumlah"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Jumlah Bayar <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={sisa}
                      step={1000}
                      disabled={isSubmitting}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tanggal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Tanggal <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="date" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="catatan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Catatan pembayaran..."
                      rows={2}
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
