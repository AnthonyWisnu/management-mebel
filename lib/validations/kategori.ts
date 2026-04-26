import { z } from "zod"

export const kategoriSchema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  deskripsi: z.string().optional(),
})

export type KategoriInput = z.infer<typeof kategoriSchema>
