"use client"

import { useEffect, useState } from "react"
import { useForm, Controller, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { karyawanSchema, type KaryawanInput } from "@/lib/validations/karyawan"
import { createKaryawan, updateKaryawan } from "@/lib/actions/karyawan"
import type { Karyawan } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

interface KaryawanFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  karyawan?: Karyawan | null
  onSuccess?: () => void
}

export function KaryawanForm({
  open,
  onOpenChange,
  karyawan,
  onSuccess,
}: KaryawanFormProps) {
  const isEdit = !!karyawan
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<KaryawanInput>({
    resolver: zodResolver(karyawanSchema) as unknown as Resolver<KaryawanInput>,
    defaultValues: {
      nama: "",
      alamat: "",
      no_telp: "",
      jabatan: "",
      gaji_setengah_hari: 0,
      gaji_satu_hari: 0,
      tanggal_bergabung: "",
      aktif: true,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset(
        karyawan
          ? {
              nama: karyawan.nama,
              alamat: karyawan.alamat ?? "",
              no_telp: karyawan.no_telp ?? "",
              jabatan: karyawan.jabatan ?? "",
              gaji_setengah_hari: karyawan.gaji_setengah_hari,
              gaji_satu_hari: karyawan.gaji_satu_hari,
              tanggal_bergabung: karyawan.tanggal_bergabung ?? "",
              aktif: karyawan.aktif,
            }
          : {
              nama: "",
              alamat: "",
              no_telp: "",
              jabatan: "",
              gaji_setengah_hari: 0,
              gaji_satu_hari: 0,
              tanggal_bergabung: "",
              aktif: true,
            }
      )
      setServerError(null)
    }
  }, [open, karyawan, form])

  const onSubmit = async (data: KaryawanInput) => {
    setServerError(null)
    const result = isEdit
      ? await updateKaryawan(karyawan!.id, data)
      : await createKaryawan(data)

    if (result.error) {
      setServerError(result.error)
      return
    }

    toast.success(isEdit ? "Karyawan berhasil diperbarui" : "Karyawan berhasil ditambahkan")
    onOpenChange(false)
    onSuccess?.()
  }

  const { formState: { isSubmitting } } = form

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Karyawan" : "Tambah Karyawan"}
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
            name="nama"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="Nama karyawan" disabled={isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="jabatan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jabatan</FormLabel>
                  <FormControl>
                    <Input placeholder="Jabatan" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
          </div>

          <FormField
            control={form.control}
            name="alamat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alamat</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Alamat karyawan"
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
              name="gaji_setengah_hari"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gaji 1/2 Hari (Rp) <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gaji_satu_hari"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gaji 1 Hari (Rp) <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
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
            name="tanggal_bergabung"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Bergabung</FormLabel>
                <FormControl>
                  <Input type="date" disabled={isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Controller
            control={form.control}
            name="aktif"
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="aktif"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                />
                <Label htmlFor="aktif">Karyawan aktif</Label>
              </div>
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
