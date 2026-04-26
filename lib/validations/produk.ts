import { z } from "zod"

export const produkSchema = z.object({
  kategori_id: z.string().min(1, "Kategori wajib dipilih"),
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  deskripsi: z.string().optional(),
  satuan: z.string().min(1, "Satuan wajib diisi"),
  foto_url: z.string().optional(),
})

export type ProdukInput = z.infer<typeof produkSchema>
