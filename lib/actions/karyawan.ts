"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin, requireAuth } from "@/lib/actions/auth"
import type { KaryawanInput } from "@/lib/validations/karyawan"
import type { Karyawan } from "@/types"

export async function getKaryawan(query?: string): Promise<Karyawan[]> {
  await requireAuth()
  const supabase = await createClient()

  let q = supabase
    .from("karyawan")
    .select("*")
    .is("deleted_at", null)
    .order("nama")

  if (query) {
    q = q.ilike("nama", `%${query}%`)
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []) as Karyawan[]
}

export async function createKaryawan(
  data: KaryawanInput
): Promise<{ error?: string }> {
  await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase.from("karyawan").insert({
    nama: data.nama,
    alamat: data.alamat || null,
    no_telp: data.no_telp || null,
    jabatan: data.jabatan || null,
    gaji_setengah_hari: data.gaji_setengah_hari,
    gaji_satu_hari: data.gaji_satu_hari,
    tanggal_bergabung: data.tanggal_bergabung || null,
    aktif: data.aktif,
  })

  if (error) return { error: error.message }
  revalidatePath("/karyawan")
  return {}
}

export async function updateKaryawan(
  id: string,
  data: KaryawanInput
): Promise<{ error?: string }> {
  await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase
    .from("karyawan")
    .update({
      nama: data.nama,
      alamat: data.alamat || null,
      no_telp: data.no_telp || null,
      jabatan: data.jabatan || null,
      gaji_setengah_hari: data.gaji_setengah_hari,
      gaji_satu_hari: data.gaji_satu_hari,
      tanggal_bergabung: data.tanggal_bergabung || null,
      aktif: data.aktif,
    })
    .eq("id", id)
    .is("deleted_at", null)

  if (error) return { error: error.message }
  revalidatePath("/karyawan")
  return {}
}

export async function deleteKaryawan(id: string): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("karyawan")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/karyawan")
  return {}
}
