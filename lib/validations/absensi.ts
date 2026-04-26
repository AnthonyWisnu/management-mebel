import { z } from "zod"

export const absensiSchema = z.object({
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  karyawan_id: z.string().min(1, "Karyawan wajib dipilih"),
  tipe_shift: z.enum(["setengah_hari", "satu_hari", "lembur"]),
  nominal: z.coerce.number().positive("Nominal harus lebih dari 0"),
  catatan: z.string().optional(),
})

export type AbsensiInput = z.infer<typeof absensiSchema>
