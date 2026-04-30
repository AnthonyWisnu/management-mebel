"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin, requireAuth } from "@/lib/actions/auth"
import type { KategoriInput } from "@/lib/validations/kategori"
import type { KategoriProduk } from "@/types"

export async function getKategori(query?: string): Promise<KategoriProduk[]> {
  await requireAuth()
  const supabase = await createClient()

  let q = supabase
    .from("kategori_produk")
    .select("*")
    .is("deleted_at", null)
    .order("nama")

  if (query) {
    q = q.ilike("nama", `%${query}%`)
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []) as KategoriProduk[]
}

export async function createKategori(
  data: KategoriInput
): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase.from("kategori_produk").insert({
    nama: data.nama,
    deskripsi: data.deskripsi || null,
  })

  if (error) return { error: error.message }
  revalidatePath("/kategori")
  return {}
}

export async function updateKategori(
  id: string,
  data: KategoriInput
): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("kategori_produk")
    .update({
      nama: data.nama,
      deskripsi: data.deskripsi || null,
    })
    .eq("id", id)
    .is("deleted_at", null)

  if (error) return { error: error.message }
  revalidatePath("/kategori")
  return {}
}

export async function deleteKategori(id: string): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("kategori_produk")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/kategori")
  return {}
}
