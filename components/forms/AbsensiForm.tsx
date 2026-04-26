"use client"

import { useEffect, useState } from "react"
import { useForm, Controller, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { absensiSchema, type AbsensiInput } from "@/lib/validations/absensi"
import { createAbsensi, updateAbsensi } from "@/lib/actions/absensi"
import type { Absensi, Karyawan } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { formatRupiah } from "@/lib/utils"

interface AbsensiFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  karyawanList: Karyawan[]
  absensi?: Absensi | null
  onSuccess?: () => void
}

const TIPE_SHIFT_OPTIONS = [
  { value: "setengah_hari" as const, label: "½ Hari" },
  { value: "satu_hari" as const, label: "1 Hari" },
  { value: "lembur" as const, label: "Lembur" },
]

function todayIso() {
  return new Date().toISOString().split("T")[0]
}

export function AbsensiForm({
  open,
  onOpenChange,
  karyawanList,
  absensi,
  onSuccess,
}: AbsensiFormProps) {
  const isEdit = !!absensi
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<AbsensiInput>({
    resolver: zodResolver(absensiSchema) as unknown as Resolver<AbsensiInput>,
    defaultValues: {
      tanggal: todayIso(),
      karyawan_id: "",
      tipe_shift: "satu_hari",
      nominal: 0,
      catatan: "",
    },
  })

  const {
    watch,
    setValue,
    getValues,
    formState: { isSubmitting },
  } = form

  const watchedKaryawanId = watch("karyawan_id")
  const watchedTipeShift = watch("tipe_shift")
  const selectedKaryawan = karyawanList.find((k) => k.id === watchedKaryawanId)

  useEffect(() => {
    if (open) {
      form.reset(
        absensi
          ? {
              tanggal: absensi.tanggal,
              karyawan_id: absensi.karyawan_id,
              tipe_shift: absensi.tipe_shift,
              nominal: absensi.nominal,
              catatan: absensi.catatan ?? "",
            }
          : {
              tanggal: todayIso(),
              karyawan_id: "",
              tipe_shift: "satu_hari",
              nominal: 0,
              catatan: "",
            }
      )
      setServerError(null)
    }
  }, [open, absensi, form])

  const karyawanOptions = karyawanList.map((k) => ({ value: k.id, label: k.nama }))

  function autoFillNominal(karyawanId: string, tipeShift: string) {
    if (tipeShift === "lembur") return
    const k = karyawanList.find((k) => k.id === karyawanId)
    if (!k) return
    if (tipeShift === "setengah_hari") setValue("nominal", k.gaji_setengah_hari)
    else if (tipeShift === "satu_hari") setValue("nominal", k.gaji_satu_hari)
  }

  const onSubmit = async (data: AbsensiInput) => {
    setServerError(null)
    const result = isEdit
      ? await updateAbsensi(absensi!.id, data)
      : await createAbsensi(data)

    if (result.error) {
      setServerError(result.error)
      return
    }

    toast.success(isEdit ? "Absensi berhasil diperbarui" : "Absensi berhasil ditambahkan")
    onOpenChange(false)
    onSuccess?.()
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Absensi" : "Tambah Absensi"}
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
                    onChange={(value) => {
                      field.onChange(value)
                      autoFillNominal(value, getValues("tipe_shift"))
                    }}
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

          <FormItem>
            <FormLabel>
              Tipe Shift <span className="text-destructive">*</span>
            </FormLabel>
            <Controller
              control={form.control}
              name="tipe_shift"
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value)
                    autoFillNominal(getValues("karyawan_id"), value)
                  }}
                  className="flex flex-row gap-6 pt-1"
                >
                  {TIPE_SHIFT_OPTIONS.map((opt) => (
                    <div key={opt.value} className="flex items-center gap-2">
                      <RadioGroupItem
                        value={opt.value}
                        id={`tipe-${opt.value}`}
                        disabled={isSubmitting}
                      />
                      <Label
                        htmlFor={`tipe-${opt.value}`}
                        className="cursor-pointer font-normal"
                      >
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            />
            {form.formState.errors.tipe_shift && (
              <p className="text-sm text-destructive">
                {form.formState.errors.tipe_shift.message}
              </p>
            )}
          </FormItem>

          <FormField
            control={form.control}
            name="nominal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Nominal (Rp) <span className="text-destructive">*</span>
                  {selectedKaryawan && watchedTipeShift !== "lembur" && (
                    <span className="text-muted-foreground font-normal ml-2 text-xs">
                      — {formatRupiah(
                        watchedTipeShift === "setengah_hari"
                          ? selectedKaryawan.gaji_setengah_hari
                          : selectedKaryawan.gaji_satu_hari
                      )} dari master
                    </span>
                  )}
                </FormLabel>
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
