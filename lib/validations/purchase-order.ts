import { z } from "zod"

export const poItemSchema = z.object({
  id: z.string().optional(),
  deskripsi: z.string().min(1, "Deskripsi item wajib diisi"),
  qty: z.coerce.number().positive("Qty harus lebih dari 0"),
  harga_satuan: z.coerce.number().min(0, "Harga tidak boleh negatif").default(0),
  catatan: z.string().optional(),
})

export const purchaseOrderSchema = z.object({
  tanggal_po: z.string().min(1, "Tanggal PO wajib diisi"),
  batas_waktu: z.string().min(1, "Batas waktu wajib diisi"),
  pelanggan_id: z.string().min(1, "Pelanggan wajib dipilih"),
  status: z.enum(["pending", "dalam_proses", "selesai", "dibatalkan"]).default("pending"),
  catatan: z.string().optional(),
  items: z.array(poItemSchema).min(1, "Minimal 1 item harus ditambahkan"),
})

export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>
export type POItemInput = z.infer<typeof poItemSchema>
