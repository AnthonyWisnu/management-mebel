import { z } from "zod"

export const karyawanSchema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  alamat: z.string().optional(),
  no_telp: z.string().optional(),
  jabatan: z.string().optional(),
  gaji_setengah_hari: z.coerce.number().min(0, "Tidak boleh negatif"),
  gaji_satu_hari: z.coerce.number().min(0, "Tidak boleh negatif"),
  tanggal_bergabung: z.string().optional(),
  aktif: z.boolean().default(true),
})

export type KaryawanInput = z.infer<typeof karyawanSchema>
