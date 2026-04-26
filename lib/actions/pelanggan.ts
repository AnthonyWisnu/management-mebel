"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin, requireAuth } from "@/lib/actions/auth"
import type { PelangganInput } from "@/lib/validations/pelanggan"
import type { Pelanggan } from "@/types"

export async function getPelanggan(query?: string): Promise<Pelanggan[]> {
  await requireAuth()
  const supabase = await createClient()

  let q = supabase
    .from("pelanggan")
    .select("*")
    .is("deleted_at", null)
    .order("nama")

  if (query) {
    q = q.ilike("nama", `%${query}%`)
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []) as Pelanggan[]
}

export async function createPelanggan(
  data: PelangganInput
): Promise<{ error?: string }> {
  await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase.from("pelanggan").insert({
    nama: data.nama,
    alamat: data.alamat || null,
    no_telp: data.no_telp || null,
    email: data.email || null,
    catatan: data.catatan || null,
  })

  if (error) return { error: error.message }
  revalidatePath("/pelanggan")
  return {}
}

export async function updatePelanggan(
  id: string,
  data: PelangganInput
): Promise<{ error?: string }> {
  await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase
    .from("pelanggan")
    .update({
      nama: data.nama,
      alamat: data.alamat || null,
      no_telp: data.no_telp || null,
      email: data.email || null,
      catatan: data.catatan || null,
    })
    .eq("id", id)
    .is("deleted_at", null)

  if (error) return { error: error.message }
  revalidatePath("/pelanggan")
  return {}
}

export async function deletePelanggan(id: string): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("pelanggan")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/pelanggan")
  return {}
}
