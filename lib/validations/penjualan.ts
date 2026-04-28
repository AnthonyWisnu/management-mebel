import { z } from "zod"

export const penjualanItemSchema = z.object({
  produk_id: z.string().min(1, "Produk wajib dipilih"),
  qty: z.coerce.number().positive("Qty harus lebih dari 0"),
  harga_jual_satuan: z.coerce.number().positive("Harga jual wajib diisi"),
  hpp_satuan: z.coerce.number().min(0, "HPP tidak boleh negatif").default(0),
})

export const penjualanSchema = z.object({
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  pelanggan_id: z.string().min(1, "Pelanggan wajib dipilih"),
  no_faktur: z.string().optional(),
  catatan: z.string().optional(),
  total_dibayar: z.coerce.number().min(0, "Tidak boleh negatif").default(0),
  items: z.array(penjualanItemSchema).min(1, "Minimal 1 item harus ditambahkan"),
})

export type PenjualanInput = z.infer<typeof penjualanSchema>
export type PenjualanItemInput = z.infer<typeof penjualanItemSchema>
