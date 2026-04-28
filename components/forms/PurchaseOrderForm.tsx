"use client"

import { useFieldArray, useForm, useWatch, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { purchaseOrderSchema, type PurchaseOrderInput } from "@/lib/validations/purchase-order"
import { createPurchaseOrder, updatePurchaseOrder } from "@/lib/actions/purchase-order"
import { formatRupiah } from "@/lib/utils"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { PurchaseOrder, Pelanggan, StatusPO } from "@/types"

const STATUS_OPTIONS: { value: StatusPO; label: string }[] = [
  { value: "pending",      label: "Pending" },
  { value: "dalam_proses", label: "Dalam Proses" },
  { value: "selesai",      label: "Selesai" },
  { value: "dibatalkan",   label: "Dibatalkan" },
]

const DEFAULT_ITEM = { deskripsi: "", qty: 1, harga_satuan: 0, catatan: "" }

interface PurchaseOrderFormProps {
  pelangganList: Pick<Pelanggan, "id" | "nama">[]
  po?: PurchaseOrder | null
}

export function PurchaseOrderForm({ pelangganList, po }: PurchaseOrderFormProps) {
  const router = useRouter()
  const isEdit = !!po
  const [serverError, setServerError] = useState<string | null>(null)

  const pelangganOptions = pelangganList.map((p) => ({ value: p.id, label: p.nama }))

  const today = new Date().toISOString().split("T")[0]

  const form = useForm<PurchaseOrderInput>({
    resolver: zodResolver(purchaseOrderSchema) as unknown as Resolver<PurchaseOrderInput>,
    defaultValues: po
      ? {
          tanggal_po:   po.tanggal_po,
          batas_waktu:  po.batas_waktu,
          pelanggan_id: po.pelanggan_id,
          status:       po.status,
          catatan:      po.catatan ?? "",
          items: po.purchase_order_item?.map((item) => ({
            id:           item.id,
            deskripsi:    item.deskripsi,
            qty:          item.qty,
            harga_satuan: item.harga_satuan,
            catatan:      item.catatan ?? "",
          })) ?? [DEFAULT_ITEM],
        }
      : {
          tanggal_po:   today,
          batas_waktu:  "",
          pelanggan_id: "",
          status:       "pending",
          catatan:      "",
          items:        [DEFAULT_ITEM],
        },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  const watchedItems = useWatch({ control: form.control, name: "items" })

  const totalEstimasi = (watchedItems ?? []).reduce(
    (sum, item) => sum + (Number(item.qty) || 0) * (Number(item.harga_satuan) || 0),
    0
  )

  const onSubmit = async (data: PurchaseOrderInput) => {
    setServerError(null)
    const result = isEdit
      ? await updatePurchaseOrder(po!.id, data)
      : await createPurchaseOrder(data)

    if (result.error) {
      setServerError(result.error)
      toast.error("Gagal menyimpan PO")
      return
    }

    toast.success(isEdit ? "PO berhasil diperbarui" : "PO berhasil dibuat")
    router.push("/purchase-order")
    router.refresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* Header info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi PO</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="pelanggan_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pelanggan <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={pelangganOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Pilih pelanggan"
                      searchPlaceholder="Cari pelanggan..."
                      emptyText="Pelanggan tidak ditemukan"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tanggal_po"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal PO <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="batas_waktu"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Batas Waktu / Deadline <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="sm:col-span-2">
              <FormField
                control={form.control}
                name="catatan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Catatan tambahan (opsional)"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Item Pesanan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-1 sm:grid-cols-[1fr_80px_120px_auto] gap-3 items-start p-3 border rounded-lg"
              >
                {/* Deskripsi */}
                <FormField
                  control={form.control}
                  name={`items.${index}.deskripsi`}
                  render={({ field }) => (
                    <FormItem>
                      {index === 0 && <FormLabel className="text-xs text-muted-foreground">Deskripsi Item</FormLabel>}
                      <FormControl>
                        <Input placeholder="Nama / deskripsi item" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Qty */}
                <FormField
                  control={form.control}
                  name={`items.${index}.qty`}
                  render={({ field }) => (
                    <FormItem>
                      {index === 0 && <FormLabel className="text-xs text-muted-foreground">Qty</FormLabel>}
                      <FormControl>
                        <Input type="number" min="0.01" step="0.01" placeholder="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Harga satuan */}
                <FormField
                  control={form.control}
                  name={`items.${index}.harga_satuan`}
                  render={({ field }) => (
                    <FormItem>
                      {index === 0 && <FormLabel className="text-xs text-muted-foreground">Harga Est.</FormLabel>}
                      <FormControl>
                        <Input type="number" min="0" step="1000" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Hapus */}
                <div className={index === 0 ? "mt-6" : "mt-0"}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    aria-label="Hapus item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append(DEFAULT_ITEM)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Item
            </Button>

            {/* Total estimasi */}
            <div className="flex justify-end pt-2 border-t">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Estimasi</p>
                <p className="text-xl font-bold tabular-nums">{formatRupiah(totalEstimasi)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {serverError && (
          <p className="text-sm text-destructive">{serverError}</p>
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Batal
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEdit ? "Simpan Perubahan" : "Buat PO"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
