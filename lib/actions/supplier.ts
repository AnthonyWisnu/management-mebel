"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin, requireAuth } from "@/lib/actions/auth"
import type { SupplierInput } from "@/lib/validations/supplier"
import type { Supplier } from "@/types"

export async function getSuppliers(query?: string): Promise<Supplier[]> {
  await requireAuth()
  const supabase = await createClient()

  let q = supabase
    .from("supplier")
    .select("*")
    .is("deleted_at", null)
    .order("nama")

  if (query) {
    q = q.ilike("nama", `%${query}%`)
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []) as Supplier[]
}

export async function createSupplier(
  data: SupplierInput
): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase.from("supplier").insert({
    nama: data.nama,
    alamat: data.alamat || null,
    no_telp: data.no_telp || null,
    email: data.email || null,
    catatan: data.catatan || null,
  })

  if (error) return { error: error.message }
  revalidatePath("/supplier")
  return {}
}

export async function updateSupplier(
  id: string,
  data: SupplierInput
): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("supplier")
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
  revalidatePath("/supplier")
  return {}
}

export async function deleteSupplier(id: string): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("supplier")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/supplier")
  return {}
}
