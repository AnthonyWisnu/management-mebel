"use client"

import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Upload, X } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { produkSchema, type ProdukInput } from "@/lib/validations/produk"
import { createProduk, updateProduk, uploadFotoProduk, deleteFotoProduk } from "@/lib/actions/produk"
import type { Produk, KategoriProduk } from "@/types"
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

interface ProdukFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  produk?: Produk | null
  kategoriList: KategoriProduk[]
  onSuccess?: () => void
}

export function ProdukForm({
  open,
  onOpenChange,
  produk,
  kategoriList,
  onSuccess,
}: ProdukFormProps) {
  const isEdit = !!produk
  const [serverError, setServerError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const kategoriOptions = kategoriList.map((k) => ({ value: k.id, label: k.nama }))

  const form = useForm<ProdukInput>({
    resolver: zodResolver(produkSchema),
    defaultValues: { kategori_id: "", nama: "", deskripsi: "", satuan: "", foto_url: "" },
  })

  useEffect(() => {
    if (open) {
      form.reset(
        produk
          ? {
              kategori_id: produk.kategori_id,
              nama: produk.nama,
              deskripsi: produk.deskripsi ?? "",
              satuan: produk.satuan,
              foto_url: produk.foto_url ?? "",
            }
          : { kategori_id: "", nama: "", deskripsi: "", satuan: "", foto_url: "" }
      )
      setPreviewUrl(produk?.foto_url ?? null)
      setServerError(null)
    }
  }, [open, produk, form])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 2MB")
      return
    }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const result = await uploadFotoProduk(fd)
      if (result.error) {
        toast.error(result.error)
      } else if (result.url) {
        form.setValue("foto_url", result.url)
        setPreviewUrl(result.url)
      }
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleRemoveFoto = async () => {
    const currentUrl = form.getValues("foto_url")
    if (currentUrl) {
      await deleteFotoProduk(currentUrl)
    }
    form.setValue("foto_url", "")
    setPreviewUrl(null)
  }

  const onSubmit = async (data: ProdukInput) => {
    setServerError(null)
    const result = isEdit
      ? await updateProduk(produk!.id, data)
      : await createProduk(data)

    if (result.error) {
      setServerError(result.error)
      return
    }

    toast.success(isEdit ? "Produk berhasil diperbarui" : "Produk berhasil ditambahkan")
    onOpenChange(false)
    onSuccess?.()
  }

  const { formState: { isSubmitting } } = form

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Produk" : "Tambah Produk"}
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
            name="kategori_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategori <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <SearchableSelect
                    options={kategoriOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Pilih kategori"
                    searchPlaceholder="Cari kategori..."
                    emptyText="Kategori tidak ditemukan"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nama"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="Nama produk" disabled={isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="satuan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Satuan <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="pcs, set, unit, dll" disabled={isSubmitting} {...field} />
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
                    placeholder="Deskripsi produk"
                    rows={2}
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>Foto Produk</FormLabel>
            {previewUrl ? (
              <div className="relative w-full h-40 rounded-md overflow-hidden border border-border">
                <Image
                  src={previewUrl}
                  alt="Foto produk"
                  fill
                  className="object-contain"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveFoto}
                  disabled={isSubmitting || uploading}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-sm text-muted-foreground">Klik untuk upload foto</span>
                    <span className="text-xs text-muted-foreground">Max 2MB, JPG/PNG/WEBP</span>
                  </>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isSubmitting || uploading}
            />
          </FormItem>

          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || uploading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting || uploading}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Form>
    </ResponsiveModal>
  )
}
