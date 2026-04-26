import { z } from "zod"

export const supplierSchema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  alamat: z.string().optional(),
  no_telp: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Format email tidak valid"),
  catatan: z.string().optional(),
})

export type SupplierInput = z.infer<typeof supplierSchema>
