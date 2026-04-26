import { z } from "zod"

export const pembelianItemSchema = z.object({
  produk_id: z.string().min(1, "Produk wajib dipilih"),
  qty: z.coerce.number().positive("Qty harus lebih dari 0"),
  harga_beli_satuan: z.coerce.number().positive("Harga beli wajib diisi"),
})

export const pembelianSchema = z.object({
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  supplier_id: z.string().min(1, "Supplier wajib dipilih"),
  no_faktur: z.string().optional(),
  catatan: z.string().optional(),
  items: z.array(pembelianItemSchema).min(1, "Minimal 1 item harus ditambahkan"),
})

export type PembelianInput = z.infer<typeof pembelianSchema>
export type PembelianItemInput = z.infer<typeof pembelianItemSchema>
