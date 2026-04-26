import { z } from "zod"

export const generatePenggajianSchema = z
  .object({
    periode_mulai: z.string().min(1, "Periode mulai wajib diisi"),
    periode_selesai: z.string().min(1, "Periode selesai wajib diisi"),
  })
  .refine((d) => d.periode_selesai >= d.periode_mulai, {
    message: "Periode selesai harus >= periode mulai",
    path: ["periode_selesai"],
  })

export const tambahPenggajianManualSchema = z
  .object({
    karyawan_id: z.string().min(1, "Karyawan wajib dipilih"),
    periode_mulai: z.string().min(1, "Periode mulai wajib diisi"),
    periode_selesai: z.string().min(1, "Periode selesai wajib diisi"),
    total_gaji_kalkulasi: z.coerce.number().min(0, "Total tidak boleh negatif"),
    total_dibayar: z.coerce.number().min(0, "Total tidak boleh negatif"),
    catatan: z.string().optional(),
  })
  .refine((d) => d.periode_selesai >= d.periode_mulai, {
    message: "Periode selesai harus >= periode mulai",
    path: ["periode_selesai"],
  })

export const updatePenggajianSchema = z.object({
  total_dibayar: z.coerce.number().min(0, "Total dibayar tidak boleh negatif"),
  catatan: z.string().optional(),
})

export type GeneratePenggajianInput = z.infer<typeof generatePenggajianSchema>
export type TambahPenggajianManualInput = z.infer<typeof tambahPenggajianManualSchema>
export type UpdatePenggajianInput = z.infer<typeof updatePenggajianSchema>
