"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { pelangganSchema, type PelangganInput } from "@/lib/validations/pelanggan"
import { createPelanggan, updatePelanggan } from "@/lib/actions/pelanggan"
import type { Pelanggan } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

interface PelangganFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pelanggan?: Pelanggan | null
  onSuccess?: () => void
}

export function PelangganForm({
  open,
  onOpenChange,
  pelanggan,
  onSuccess,
}: PelangganFormProps) {
  const isEdit = !!pelanggan
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<PelangganInput>({
    resolver: zodResolver(pelangganSchema),
    defaultValues: { nama: "", alamat: "", no_telp: "", email: "", catatan: "" },
  })

  useEffect(() => {
    if (open) {
      form.reset(
        pelanggan
          ? {
              nama: pelanggan.nama,
              alamat: pelanggan.alamat ?? "",
              no_telp: pelanggan.no_telp ?? "",
              email: pelanggan.email ?? "",
              catatan: pelanggan.catatan ?? "",
            }
          : { nama: "", alamat: "", no_telp: "", email: "", catatan: "" }
      )
      setServerError(null)
    }
  }, [open, pelanggan, form])

  const onSubmit = async (data: PelangganInput) => {
    setServerError(null)
    const result = isEdit
      ? await updatePelanggan(pelanggan!.id, data)
      : await createPelanggan(data)

    if (result.error) {
      setServerError(result.error)
      return
    }

    toast.success(isEdit ? "Pelanggan berhasil diperbarui" : "Pelanggan berhasil ditambahkan")
    onOpenChange(false)
    onSuccess?.()
  }

  const { formState: { isSubmitting } } = form

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Pelanggan" : "Tambah Pelanggan"}
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
            name="nama"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="Nama pelanggan" disabled={isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="alamat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alamat</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Alamat lengkap"
                    rows={2}
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="no_telp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>No. Telp</FormLabel>
                  <FormControl>
                    <Input placeholder="08xx..." disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="email@contoh.com"
                      disabled={isSubmitting}
                      {...field}
                    />
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
                    placeholder="Catatan tambahan"
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
