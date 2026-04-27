"use client"

import { useFieldArray, useForm, useWatch, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Plus, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { pembelianSchema, type PembelianInput } from "@/lib/validations/pembelian"
import { createPembelian, updatePembelian } from "@/lib/actions/pembelian"
import type { Supplier, Produk, Pembelian } from "@/types"
import { formatRupiah } from "@/lib/utils"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { NotaUpload } from "@/components/ui/NotaUpload"

interface PembelianFormProps {
  suppliers: Supplier[]
  produks: Produk[]
  pembelian?: Pembelian | null
}

const DEFAULT_ITEM = { produk_id: "", qty: 1, harga_beli_satuan: 0 }

export function PembelianForm({ suppliers, produks, pembelian }: PembelianFormProps) {
  const router = useRouter()
  const isEdit = !!pembelian
  const [serverError, setServerError] = useState<string | null>(null)
  const [notaUrl, setNotaUrl] = useState<string | null | undefined>(
    pembelian?.nota_url ?? undefined
  )

  const supplierOptions = suppliers.map((s) => ({ value: s.id, label: s.nama }))
  const produkOptions = produks.map((p) => ({
    value: p.id,
    label: p.nama + (p.satuan ? ` (${p.satuan})` : ""),
  }))

  const form = useForm<PembelianInput>({
    resolver: zodResolver(pembelianSchema) as unknown as Resolver<PembelianInput>,
    defaultValues: pembelian
      ? {
          tanggal: pembelian.tanggal,
          supplier_id: pembelian.supplier_id,
          no_faktur: pembelian.no_faktur ?? "",
          catatan: pembelian.catatan ?? "",
          items: pembelian.pembelian_item?.map((item) => ({
            produk_id: item.produk_id,
            qty: item.qty,
            harga_beli_satuan: item.harga_beli_satuan,
          })) ?? [DEFAULT_ITEM],
        }
      : {
          tanggal: new Date().toISOString().split("T")[0],
          supplier_id: "",
          no_faktur: "",
          catatan: "",
          items: [DEFAULT_ITEM],
        },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  const watchedItems = useWatch({ control: form.control, name: "items" })

  const getSubtotal = (index: number) => {
    const item = watchedItems?.[index]
    if (!item) return 0
    return (Number(item.qty) || 0) * (Number(item.harga_beli_satuan) || 0)
  }

  const total = (watchedItems ?? []).reduce(
    (sum, item) => sum + (Number(item.qty) || 0) * (Number(item.harga_beli_satuan) || 0),
    0
  )

  const onSubmit = async (data: PembelianInput) => {
    setServerError(null)
    const result = isEdit
      ? await updatePembelian(pembelian!.id, data, notaUrl)
      : await createPembelian(data, notaUrl)

    if (result.error) {
      setServerError(result.error)
      return
    }

    toast.success(
      isEdit ? "Pembelian berhasil diperbarui" : "Pembelian berhasil ditambahkan"
    )
    router.push("/pembelian")
    router.refresh()
  }

  const { formState: { isSubmitting, errors } } = form
  const itemsRootError = (errors.items as { message?: string } | undefined)?.message
    ?? (errors.items as { root?: { message?: string } } | undefined)?.root?.message

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-32 md:pb-8">
        {serverError && (
          <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            {serverError}
          </div>
        )}

        {/* INFORMASI PEMBELIAN */}
        <Card>
          <CardContent className="p-4 md:p-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Informasi Pembelian
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                name="no_faktur"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>No. Faktur</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Kosongkan untuk auto-generate"
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
              name="supplier_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Supplier <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={supplierOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Pilih supplier..."
                      searchPlaceholder="Cari supplier..."
                      emptyText="Supplier tidak ditemukan"
                      disabled={isSubmitting}
                    />
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
          </CardContent>
        </Card>

        {/* NOTA */}
        <Card>
          <CardContent className="p-4 md:p-6 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Nota / Foto Faktur
            </p>
            <NotaUpload
              folder="pembelian"
              existingUrl={pembelian?.nota_url}
              onUploadComplete={(url) => setNotaUrl(url)}
              disabled={isSubmitting}
            />
          </CardContent>
        </Card>

        {/* DETAIL ITEM */}
        <div className="space-y-3">
          <p className="font-semibold">Detail Item</p>

          {itemsRootError && (
            <p className="text-sm text-destructive">{itemsRootError}</p>
          )}

          {/* Desktop: tabel */}
          <div className="hidden md:block rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold w-[38%]">Produk</th>
                  <th className="px-4 py-3 text-right font-semibold w-[12%]">Qty</th>
                  <th className="px-4 py-3 text-right font-semibold w-[24%]">
                    Harga Beli (Rp)
                  </th>
                  <th className="px-4 py-3 text-right font-semibold w-[20%]">Subtotal</th>
                  <th className="px-2 py-3 w-[6%]" />
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => (
                  <tr key={field.id} className="border-t">
                    <td className="px-4 py-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.produk_id`}
                        render={({ field: f }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <SearchableSelect
                                options={produkOptions}
                                value={f.value}
                                onChange={f.onChange}
                                placeholder="Pilih produk..."
                                searchPlaceholder="Cari produk..."
                                emptyText="Produk tidak ditemukan"
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage className="mt-1" />
                          </FormItem>
                        )}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.qty`}
                        render={({ field: f }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                step={1}
                                className="text-right"
                                disabled={isSubmitting}
                                {...f}
                              />
                            </FormControl>
                            <FormMessage className="mt-1" />
                          </FormItem>
                        )}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.harga_beli_satuan`}
                        render={({ field: f }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                step={1000}
                                className="text-right"
                                disabled={isSubmitting}
                                {...f}
                              />
                            </FormControl>
                            <FormMessage className="mt-1" />
                          </FormItem>
                        )}
                      />
                    </td>
                    <td className="px-4 py-2 text-right font-medium tabular-nums whitespace-nowrap">
                      {formatRupiah(getSubtotal(index))}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1 || isSubmitting}
                        aria-label="Hapus item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/30 border-t">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right font-semibold">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums text-base">
                    {formatRupiah(total)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile: kartu vertikal */}
          <div className="md:hidden space-y-3">
            {fields.map((field, index) => (
              <Card key={field.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Item {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive -mr-1"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1 || isSubmitting}
                      aria-label="Hapus item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name={`items.${index}.produk_id`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>
                          Produk <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <SearchableSelect
                            options={produkOptions}
                            value={f.value}
                            onChange={f.onChange}
                            placeholder="Pilih produk..."
                            searchPlaceholder="Cari produk..."
                            emptyText="Produk tidak ditemukan"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.qty`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>
                            Qty <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              step={1}
                              disabled={isSubmitting}
                              {...f}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.harga_beli_satuan`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>
                            Harga Beli <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step={1000}
                              disabled={isSubmitting}
                              {...f}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t">
                    <span className="text-sm text-muted-foreground">Subtotal</span>
                    <span className="font-semibold tabular-nums">
                      {formatRupiah(getSubtotal(index))}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full md:w-auto"
            onClick={() => append({ ...DEFAULT_ITEM })}
            disabled={isSubmitting}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Item
          </Button>
        </div>

        {/* Desktop footer */}
        <div className="hidden md:flex items-center justify-between pt-4 border-t">
          <p className="text-base font-semibold">
            Total:{" "}
            <span className="tabular-nums text-lg">{formatRupiah(total)}</span>
          </p>
          <div className="flex gap-3">
            <Link href="/pembelian" className={cn(buttonVariants({ variant: "outline" }))}>
              Batal
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>

        {/* Mobile sticky footer */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-background border-t px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Pembelian</span>
            <span className="text-lg font-bold tabular-nums">{formatRupiah(total)}</span>
          </div>
          <div className="flex gap-3">
            <Link
              href="/pembelian"
              className={cn(buttonVariants({ variant: "outline" }), "flex-1 justify-center")}
            >
              Batal
            </Link>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
