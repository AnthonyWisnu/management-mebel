import { z } from "zod"

export const createUserSchema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  role: z.enum(["admin", "pegawai"], { error: "Pilih role yang valid" }),
})

export const updateUserSchema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  role: z.enum(["admin", "pegawai"], { error: "Pilih role yang valid" }),
  password: z
    .string()
    .optional()
    .refine((v) => !v || v.length >= 8, "Password minimal 8 karakter"),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
