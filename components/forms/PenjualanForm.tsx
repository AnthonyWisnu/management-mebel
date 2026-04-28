"use client"

import { useFieldArray, useForm, useWatch, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import { Plus, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { penjualanSchema, type PenjualanInput } from "@/lib/validations/penjualan"
import { createPenjualan, updatePenjualan } from "@/lib/actions/penjualan"
import type { Pelanggan, Produk, Penjualan } from "@/types"
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

interface PenjualanFormProps {
  pelangganList: Pelanggan[]
  produks: Produk[]
  isAdmin: boolean
  penjualan?: Penjualan | null
}

const DEFAULT_ITEM = { produk_id: "", qty: 1, harga_jual_satuan: 0, hpp_satuan: 0 }

export function PenjualanForm({
  pelangganList,
  produks,
  isAdmin,
  penjualan,
}: PenjualanFormProps) {
  const router = useRouter()
  const isEdit = !!penjualan
  const [serverError, setServerError] = useState<string | null>(null)
  const [notaUrl, setNotaUrl] = useState<string | null | undefined>(
    penjualan?.nota_url ?? undefined
  )

  const pelangganOptions = pelangganList.map((p) => ({ value: p.id, label: p.nama }))
  const produkOptions = produks.map((p) => ({
    value: p.id,
    label: p.nama + (p.satuan ? ` (${p.satuan})` : ""),
  }))
  const produkMap = useMemo(() => new Map(produks.map((p) => [p.id, p])), [produks])

  const form = useForm<PenjualanInput>({
    resolver: zodResolver(penjualanSchema) as unknown as Resolver<PenjualanInput>,
    defaultValues: penjualan
      ? {
          tanggal: penjualan.tanggal,
          pelanggan_id: penjualan.pelanggan_id,
          catatan: penjualan.catatan ?? "",
          total_dibayar: penjualan.total_dibayar,
          items: penjualan.penjualan_item?.map((item) => ({
            produk_id: item.produk_id,
            qty: item.qty,
            harga_jual_satuan: item.harga_jual_satuan,
            hpp_satuan: isAdmin ? item.hpp_satuan : 0,
          })) ?? [DEFAULT_ITEM],
        }
      : {
          tanggal: new Date().toISOString().split("T")[0],
          pelanggan_id: "",
          catatan: "",
          total_dibayar: 0,
          items: [DEFAULT_ITEM],
        },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  const watchedItems = useWatch({ control: form.control, name: "items" })
  const watchedDibayar = useWatch({ control: form.control, name: "total_dibayar" })

  const getSubtotalJual = (index: number) => {
    const item = watchedItems?.[index]
    if (!item) return 0
    return (Number(item.qty) || 0) * (Number(item.harga_jual_satuan) || 0)
  }

  const getSubtotalHpp = (index: number) => {
    const item = watchedItems?.[index]
    if (!item) return 0
    return (Number(item.qty) || 0) * (Number(item.hpp_satuan) || 0)
  }

  const totalPenjualan = (watchedItems ?? []).reduce(
    (sum, item) =>
      sum + (Number(item.qty) || 0) * (Number(item.harga_jual_satuan) || 0),
    0
  )
  const totalHpp = isAdmin
    ? (watchedItems ?? []).reduce(
        (sum, item) =>
          sum + (Number(item.qty) || 0) * (Number(item.hpp_satuan) || 0),
        0
      )
    : 0
  const profit = totalPenjualan - totalHpp

  const onSubmit = async (data: PenjualanInput) => {
    setServerError(null)
    const result = isEdit
      ? await updatePenjualan(penjualan!.id, data, notaUrl)
      : await createPenjualan(data, notaUrl)

    if (result.error) {
      setServerError(result.error)
      return
    }

    toast.success(
      isEdit ? "Penjualan berhasil diperbarui" : "Penjualan berhasil ditambahkan"
    )
    router.push("/penjualan")
    router.refresh()
  }

  const {
    formState: { isSubmitting, errors },
  } = form
  const itemsRootError =
    (errors.items as { message?: string } | undefined)?.message ??
    (errors.items as { root?: { message?: string } } | undefined)?.root?.message

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-40 md:pb-8">
        {serverError && (
          <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            {serverError}
          </div>
        )}

        {/* INFORMASI PENJUALAN */}
        <Card>
          <CardContent className="p-4 md:p-6 space-y-4">
            <p className="text-sm font-semibold text-muted-foreground">
              Informasi Penjualan
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

            </div>

            <FormField
              control={form.control}
              name="pelanggan_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Pelanggan <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={pelangganOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Pilih pelanggan..."
                      searchPlaceholder="Cari pelanggan..."
                      emptyText="Pelanggan tidak ditemukan"
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
            <p className="text-sm font-semibold text-muted-foreground">
              Nota / Foto Faktur
            </p>
            <NotaUpload
              folder="penjualan"
              existingUrl={penjualan?.nota_url}
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
                  <th className="px-3 py-3 text-left font-semibold w-[32%]">Produk</th>
                  <th className="px-3 py-3 text-right font-semibold w-[9%]">Qty</th>
                  <th className="px-3 py-3 text-right font-semibold w-[17%]">
                    Harga Jual (Rp)
                  </th>
                  {isAdmin && (
                    <th className="px-3 py-3 text-right font-semibold w-[15%]">
                      HPP (Rp)
                    </th>
                  )}
                  <th className="px-3 py-3 text-right font-semibold w-[15%]">
                    Sub. Jual
                  </th>
                  {isAdmin && (
                    <th className="px-3 py-3 text-right font-semibold w-[13%]">
                      Sub. HPP
                    </th>
                  )}
                  <th className="px-2 py-3 w-[6%]" />
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => (
                  <tr key={field.id} className="border-t">
                    <td className="px-3 py-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.produk_id`}
                        render={({ field: f }) => {
                          const selectedProduk = produkMap.get(f.value)
                          return (
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
                              {selectedProduk && (
                                <p className={`text-xs mt-1 ${selectedProduk.stok <= 0 ? "text-destructive" : "text-muted-foreground"}`}>
                                  Stok: {selectedProduk.stok} {selectedProduk.satuan}
                                </p>
                              )}
                              <FormMessage className="mt-1" />
                            </FormItem>
                          )
                        }}
                      />
                    </td>
                    <td className="px-3 py-2">
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
                    <td className="px-3 py-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.harga_jual_satuan`}
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
                    {isAdmin && (
                      <td className="px-3 py-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.hpp_satuan`}
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
                    )}
                    <td className="px-3 py-2 text-right font-medium tabular-nums whitespace-nowrap">
                      {formatRupiah(getSubtotalJual(index))}
                    </td>
                    {isAdmin && (
                      <td className="px-3 py-2 text-right text-muted-foreground tabular-nums whitespace-nowrap text-xs">
                        {formatRupiah(getSubtotalHpp(index))}
                      </td>
                    )}
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
                  <td
                    colSpan={isAdmin ? 4 : 3}
                    className="px-3 py-3 text-right font-semibold"
                  >
                    Total Penjualan
                  </td>
                  <td className="px-3 py-3 text-right font-bold tabular-nums">
                    {formatRupiah(totalPenjualan)}
                  </td>
                  {isAdmin && (
                    <td className="px-3 py-3 text-right text-muted-foreground tabular-nums text-xs font-medium">
                      {formatRupiah(totalHpp)}
                    </td>
                  )}
                  <td />
                </tr>
                {isAdmin && (
                  <tr className="border-t">
                    <td colSpan={5} className="px-3 py-2 text-right font-semibold">
                      Profit Bersih
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2 text-right font-bold tabular-nums",
                        profit >= 0 ? "text-green-600" : "text-destructive"
                      )}
                    >
                      {formatRupiah(profit)}
                    </td>
                    <td />
                  </tr>
                )}
              </tfoot>
            </table>
          </div>

          {/* Summary Pembayaran — desktop */}
          <div className="hidden md:block rounded-lg border bg-muted/30 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Transaksi</span>
              <span className="font-medium tabular-nums">{formatRupiah(totalPenjualan)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <label className="text-muted-foreground">Jumlah Dibayar</label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => form.setValue("total_dibayar", totalPenjualan)}
                  disabled={isSubmitting}
                >
                  Lunas
                </Button>
                <FormField
                  control={form.control}
                  name="total_dibayar"
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          className="w-44 text-right h-8"
                          disabled={isSubmitting}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            {(() => {
              const sisa = totalPenjualan - (Number(watchedDibayar) ?? totalPenjualan)
              if (sisa === 0) return (
                <div className="flex justify-between text-sm text-green-600 font-medium">
                  <span>Status</span><span>Lunas</span>
                </div>
              )
              if (sisa > 0) return (
                <div className="flex justify-between text-sm text-destructive font-medium">
                  <span>Sisa Piutang</span><span className="tabular-nums">{formatRupiah(sisa)}</span>
                </div>
              )
              return (
                <div className="flex justify-between text-sm text-blue-600 font-medium">
                  <span>Kembalian / Kredit</span><span className="tabular-nums">{formatRupiah(Math.abs(sisa))}</span>
                </div>
              )
            })()}
          </div>
          {/* Mobile: kartu vertikal */}
          <div className="md:hidden space-y-3">
            {fields.map((field, index) => (
              <Card key={field.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-muted-foreground">
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
                    render={({ field: f }) => {
                      const selectedProduk = produkMap.get(f.value)
                      return (
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
                          {selectedProduk && (
                            <p className={`text-xs ${selectedProduk.stok <= 0 ? "text-destructive" : "text-muted-foreground"}`}>
                              Stok: {selectedProduk.stok} {selectedProduk.satuan}
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )
                    }}
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
                      name={`items.${index}.harga_jual_satuan`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>
                            Harga Jual <span className="text-destructive">*</span>
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

                  {isAdmin && (
                    <FormField
                      control={form.control}
                      name={`items.${index}.hpp_satuan`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>HPP / Satuan (Rp)</FormLabel>
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
                  )}

                  <div className="pt-1 border-t space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Subtotal Jual</span>
                      <span className="font-semibold tabular-nums">
                        {formatRupiah(getSubtotalJual(index))}
                      </span>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Subtotal HPP</span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatRupiah(getSubtotalHpp(index))}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary Pembayaran — mobile */}
          <div className="md:hidden rounded-lg border bg-muted/30 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Transaksi</span>
              <span className="font-medium tabular-nums">{formatRupiah(totalPenjualan)}</span>
            </div>
            <div className="flex justify-between items-center text-sm gap-2">
              <label className="text-muted-foreground shrink-0">Jumlah Dibayar</label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs shrink-0"
                  onClick={() => form.setValue("total_dibayar", totalPenjualan)}
                  disabled={isSubmitting}
                >
                  Lunas
                </Button>
                <FormField
                  control={form.control}
                  name="total_dibayar"
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          className="w-32 text-right h-8"
                          disabled={isSubmitting}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            {(() => {
              const sisa = totalPenjualan - (Number(watchedDibayar) ?? totalPenjualan)
              if (sisa === 0) return (
                <div className="flex justify-between text-sm text-green-600 font-medium">
                  <span>Status</span><span>Lunas</span>
                </div>
              )
              if (sisa > 0) return (
                <div className="flex justify-between text-sm text-destructive font-medium">
                  <span>Sisa Piutang</span><span className="tabular-nums">{formatRupiah(sisa)}</span>
                </div>
              )
              return (
                <div className="flex justify-between text-sm text-blue-600 font-medium">
                  <span>Kembalian / Kredit</span><span className="tabular-nums">{formatRupiah(Math.abs(sisa))}</span>
                </div>
              )
            })()}
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
        <div className="hidden md:block pt-4 border-t space-y-3">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-6">
                <span className="text-muted-foreground w-36 text-right">
                  Total Penjualan:
                </span>
                <span className="font-bold tabular-nums text-base">
                  {formatRupiah(totalPenjualan)}
                </span>
              </div>
              {isAdmin && (
                <>
                  <div className="flex items-center gap-6">
                    <span className="text-muted-foreground w-36 text-right">Total HPP:</span>
                    <span className="font-medium tabular-nums text-muted-foreground">
                      {formatRupiah(totalHpp)}
                    </span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-muted-foreground w-36 text-right">Profit Bersih:</span>
                    <span
                      className={cn(
                        "font-bold tabular-nums text-base",
                        profit >= 0 ? "text-green-600" : "text-destructive"
                      )}
                    >
                      {formatRupiah(profit)}
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-3 shrink-0">
              <Link
                href="/penjualan"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Batal
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile sticky footer */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-background border-t px-4 py-3 space-y-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Penjualan</span>
              <span className="font-bold tabular-nums text-base">
                {formatRupiah(totalPenjualan)}
              </span>
            </div>
            {isAdmin && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Total HPP</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatRupiah(totalHpp)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Profit</span>
                  <span
                    className={cn(
                      "font-semibold tabular-nums",
                      profit >= 0 ? "text-green-600" : "text-destructive"
                    )}
                  >
                    {formatRupiah(profit)}
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="flex gap-3">
            <Link
              href="/penjualan"
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
