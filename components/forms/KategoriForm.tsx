"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { kategoriSchema, type KategoriInput } from "@/lib/validations/kategori"
import { createKategori, updateKategori } from "@/lib/actions/kategori"
import type { KategoriProduk } from "@/types"
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

interface KategoriFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  kategori?: KategoriProduk | null
  onSuccess?: () => void
}

export function KategoriForm({
  open,
  onOpenChange,
  kategori,
  onSuccess,
}: KategoriFormProps) {
  const isEdit = !!kategori
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<KategoriInput>({
    resolver: zodResolver(kategoriSchema),
    defaultValues: { nama: "", deskripsi: "" },
  })

  useEffect(() => {
    if (open) {
      form.reset(
        kategori
          ? { nama: kategori.nama, deskripsi: kategori.deskripsi ?? "" }
          : { nama: "", deskripsi: "" }
      )
      setServerError(null)
    }
  }, [open, kategori, form])

  const onSubmit = async (data: KategoriInput) => {
    setServerError(null)
    const result = isEdit
      ? await updateKategori(kategori!.id, data)
      : await createKategori(data)

    if (result.error) {
      setServerError(result.error)
      return
    }

    toast.success(isEdit ? "Kategori berhasil diperbarui" : "Kategori berhasil ditambahkan")
    onOpenChange(false)
    onSuccess?.()
  }

  const { formState: { isSubmitting } } = form

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Kategori" : "Tambah Kategori"}
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
                  <Input placeholder="Nama kategori" disabled={isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deskripsi"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deskripsi</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Deskripsi kategori"
                    rows={3}
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
