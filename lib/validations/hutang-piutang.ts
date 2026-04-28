import { z } from "zod"

export const CatatPembayaranSchema = z.object({
  jumlah:  z.coerce.number().positive("Jumlah harus positif"),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  catatan: z.string().optional(),
})

export type CatatPembayaranInput = z.infer<typeof CatatPembayaranSchema>
