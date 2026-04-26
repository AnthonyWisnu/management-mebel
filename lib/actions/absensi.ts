"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin, requireAuth } from "@/lib/actions/auth"
import type { AbsensiInput } from "@/lib/validations/absensi"
import type { Absensi } from "@/types"

export interface AbsensiFilters {
  tanggal_dari?: string
  tanggal_sampai?: string
  karyawan_id?: string
  tipe_shift?: string
}

export async function getAbsensis(filters?: AbsensiFilters): Promise<Absensi[]> {
  await requireAuth()
  const supabase = await createClient()

  let q = supabase
    .from("absensi")
    .select("*, karyawan(id, nama)")
    .is("deleted_at", null)
    .order("tanggal", { ascending: false })
    .order("created_at", { ascending: false })

  if (filters?.tanggal_dari) q = q.gte("tanggal", filters.tanggal_dari)
  if (filters?.tanggal_sampai) q = q.lte("tanggal", filters.tanggal_sampai)
  if (filters?.karyawan_id) q = q.eq("karyawan_id", filters.karyawan_id)
  if (filters?.tipe_shift) q = q.eq("tipe_shift", filters.tipe_shift)

  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []) as Absensi[]
}

export async function getAbsensiByPeriode(
  karyawan_id: string,
  periode_mulai: string,
  periode_selesai: string
): Promise<Absensi[]> {
  await requireAuth()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("absensi")
    .select("*")
    .eq("karyawan_id", karyawan_id)
    .gte("tanggal", periode_mulai)
    .lte("tanggal", periode_selesai)
    .is("deleted_at", null)
    .order("tanggal")

  if (error) throw new Error(error.message)
  return (data ?? []) as Absensi[]
}

export async function createAbsensi(
  input: AbsensiInput
): Promise<{ error?: string }> {
  const profile = await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase.from("absensi").insert({
    tanggal: input.tanggal,
    karyawan_id: input.karyawan_id,
    tipe_shift: input.tipe_shift,
    nominal: Number(input.nominal),
    catatan: input.catatan || null,
    dibuat_oleh: profile.id,
  })

  if (error) return { error: error.message }
  revalidatePath("/absensi")
  return {}
}

export async function updateAbsensi(
  id: string,
  input: AbsensiInput
): Promise<{ error?: string }> {
  await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase
    .from("absensi")
    .update({
      tanggal: input.tanggal,
      karyawan_id: input.karyawan_id,
      tipe_shift: input.tipe_shift,
      nominal: Number(input.nominal),
      catatan: input.catatan || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("deleted_at", null)

  if (error) return { error: error.message }
  revalidatePath("/absensi")
  return {}
}

export async function deleteAbsensi(id: string): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("absensi")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/absensi")
  return {}
}
