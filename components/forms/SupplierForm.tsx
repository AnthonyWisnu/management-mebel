"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { supplierSchema, type SupplierInput } from "@/lib/validations/supplier"
import { createSupplier, updateSupplier } from "@/lib/actions/supplier"
import type { Supplier } from "@/types"
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

interface SupplierFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier?: Supplier | null
  onSuccess?: () => void
}

export function SupplierForm({
  open,
  onOpenChange,
  supplier,
  onSuccess,
}: SupplierFormProps) {
  const isEdit = !!supplier
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<SupplierInput>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { nama: "", alamat: "", no_telp: "", email: "", catatan: "" },
  })

  useEffect(() => {
    if (open) {
      form.reset(
        supplier
          ? {
              nama: supplier.nama,
              alamat: supplier.alamat ?? "",
              no_telp: supplier.no_telp ?? "",
              email: supplier.email ?? "",
              catatan: supplier.catatan ?? "",
            }
          : { nama: "", alamat: "", no_telp: "", email: "", catatan: "" }
      )
      setServerError(null)
    }
  }, [open, supplier, form])

  const onSubmit = async (data: SupplierInput) => {
    setServerError(null)
    const result = isEdit
      ? await updateSupplier(supplier!.id, data)
      : await createSupplier(data)

    if (result.error) {
      setServerError(result.error)
      return
    }

    toast.success(isEdit ? "Supplier berhasil diperbarui" : "Supplier berhasil ditambahkan")
    onOpenChange(false)
    onSuccess?.()
  }

  const { formState: { isSubmitting } } = form

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Supplier" : "Tambah Supplier"}
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
                  <Input placeholder="Nama supplier" disabled={isSubmitting} {...field} />
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
