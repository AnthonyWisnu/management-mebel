"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin, requireAuth } from "@/lib/actions/auth"
import type { ProdukInput } from "@/lib/validations/produk"
import type { Produk } from "@/types"

export async function getProduk(query?: string): Promise<Produk[]> {
  await requireAuth()
  const supabase = await createClient()

  let q = supabase
    .from("produk")
    .select("*, kategori_produk(id, nama)")
    .is("deleted_at", null)
    .order("nama")

  if (query) {
    q = q.ilike("nama", `%${query}%`)
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []) as Produk[]
}

export async function uploadFotoProduk(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  await requireAuth()
  const supabase = await createClient()

  const file = formData.get("file") as File | null
  if (!file) return { error: "File tidak ditemukan" }

  const ext = file.name.split(".").pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from("produk-foto")
    .upload(fileName, file, { upsert: false })

  if (error) return { error: error.message }

  const { data } = supabase.storage.from("produk-foto").getPublicUrl(fileName)
  return { url: data.publicUrl }
}

export async function deleteFotoProduk(url: string): Promise<void> {
  await requireAuth()
  const supabase = await createClient()

  const path = url.split("/produk-foto/").pop()
  if (!path) return

  await supabase.storage.from("produk-foto").remove([path])
}

export async function createProduk(
  data: ProdukInput
): Promise<{ error?: string }> {
  await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase.from("produk").insert({
    kategori_id: data.kategori_id,
    nama: data.nama,
    deskripsi: data.deskripsi || null,
    satuan: data.satuan,
    foto_url: data.foto_url || null,
  })

  if (error) return { error: error.message }
  revalidatePath("/produk")
  return {}
}

export async function updateProduk(
  id: string,
  data: ProdukInput
): Promise<{ error?: string }> {
  await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase
    .from("produk")
    .update({
      kategori_id: data.kategori_id,
      nama: data.nama,
      deskripsi: data.deskripsi || null,
      satuan: data.satuan,
      foto_url: data.foto_url || null,
    })
    .eq("id", id)
    .is("deleted_at", null)

  if (error) return { error: error.message }
  revalidatePath("/produk")
  return {}
}

export async function deleteProduk(id: string): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("produk")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/produk")
  return {}
}
