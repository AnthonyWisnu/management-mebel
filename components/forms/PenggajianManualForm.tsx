"use client"

import { useEffect, useState } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { tambahPenggajianManualSchema, type TambahPenggajianManualInput } from "@/lib/validations/penggajian"
import { createPenggajianManual } from "@/lib/actions/penggajian"
import type { Karyawan } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import { SearchableSelect } from "@/components/ui/searchable-select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

interface PenggajianManualFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  karyawanList: Karyawan[]
  onSuccess?: () => void
}

function todayIso() {
  return new Date().toISOString().split("T")[0]
}

export function PenggajianManualForm({
  open,
  onOpenChange,
  karyawanList,
  onSuccess,
}: PenggajianManualFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<TambahPenggajianManualInput>({
    resolver: zodResolver(tambahPenggajianManualSchema) as unknown as Resolver<TambahPenggajianManualInput>,
    defaultValues: {
      karyawan_id: "",
      periode_mulai: "",
      periode_selesai: "",
      total_gaji_kalkulasi: 0,
      total_dibayar: 0,
      catatan: "",
    },
  })

  const { formState: { isSubmitting } } = form

  useEffect(() => {
    if (open) {
      form.reset({
        karyawan_id: "",
        periode_mulai: "",
        periode_selesai: "",
        total_gaji_kalkulasi: 0,
        total_dibayar: 0,
        catatan: "",
      })
      setServerError(null)
    }
  }, [open, form])

  const karyawanOptions = karyawanList.map((k) => ({ value: k.id, label: k.nama }))

  const onSubmit = async (data: TambahPenggajianManualInput) => {
    setServerError(null)
    const result = await createPenggajianManual(data)
    if (result.error) {
      setServerError(result.error)
      return
    }
    toast.success("Penggajian berhasil ditambahkan")
    onOpenChange(false)
    onSuccess?.()
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Tambah Penggajian Manual"
      className="sm:max-w-lg"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {serverError}
            </div>
          )}

          <FormField
            control={form.control}
            name="karyawan_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Karyawan <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <SearchableSelect
                    options={karyawanOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Pilih karyawan"
                    searchPlaceholder="Cari karyawan..."
                    emptyText="Karyawan tidak ditemukan"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="periode_mulai"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Periode Mulai <span className="text-destructive">*</span>
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
              name="periode_selesai"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Periode Selesai <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="date" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="total_gaji_kalkulasi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Total Kalkulasi (Rp) <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="number" min={0} placeholder="0" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="total_dibayar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Total Dibayar (Rp) <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="number" min={0} placeholder="0" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="catatan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Catatan</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Catatan tambahan..."
                    rows={2}
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Form>
    </ResponsiveModal>
  )
}
