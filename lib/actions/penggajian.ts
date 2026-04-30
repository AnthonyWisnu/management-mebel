"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin, requireAuth } from "@/lib/actions/auth"
import type {
  GeneratePenggajianInput,
  TambahPenggajianManualInput,
  UpdatePenggajianInput,
} from "@/lib/validations/penggajian"
import type { Penggajian } from "@/types"

export interface PenggajianFilters {
  periode_mulai?: string
  periode_selesai?: string
  karyawan_id?: string
  status?: string
}

export async function getPenggajians(
  filters?: PenggajianFilters
): Promise<Penggajian[]> {
  await requireAuth()
  const supabase = await createClient()

  let q = supabase
    .from("penggajian")
    .select("*, karyawan(id, nama, jabatan)")
    .order("periode_mulai", { ascending: false })
    .order("created_at", { ascending: false })

  if (filters?.periode_mulai) q = q.gte("periode_mulai", filters.periode_mulai)
  if (filters?.periode_selesai) q = q.lte("periode_selesai", filters.periode_selesai)
  if (filters?.karyawan_id) q = q.eq("karyawan_id", filters.karyawan_id)
  if (filters?.status) q = q.eq("status", filters.status)

  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []) as Penggajian[]
}

export async function getPenggajianById(id: string): Promise<Penggajian | null> {
  await requireAuth()
  const supabase = await createClient()

  const { data: pg, error } = await supabase
    .from("penggajian")
    .select("*, karyawan(*)")
    .eq("id", id)
    .single()

  if (error || !pg) return null

  const { data: absensis } = await supabase
    .from("absensi")
    .select("*")
    .eq("karyawan_id", pg.karyawan_id)
    .gte("tanggal", pg.periode_mulai)
    .lte("tanggal", pg.periode_selesai)
    .is("deleted_at", null)
    .order("tanggal")

  return { ...pg, absensi: absensis ?? [] } as Penggajian
}

export async function generatePenggajian(
  input: GeneratePenggajianInput
): Promise<{ error?: string; count?: number; skipped?: number }> {
  const profile = await requireAuth()
  const supabase = await createClient()

  const { data: absensis, error: errAbsensi } = await supabase
    .from("absensi")
    .select("karyawan_id, nominal")
    .gte("tanggal", input.periode_mulai)
    .lte("tanggal", input.periode_selesai)
    .is("deleted_at", null)

  if (errAbsensi) return { error: errAbsensi.message }
  if (!absensis?.length) {
    return { error: "Tidak ada data absensi dalam periode ini" }
  }

  // Sum nominal per karyawan
  const byKaryawan = new Map<string, number>()
  for (const a of absensis) {
    byKaryawan.set(a.karyawan_id, (byKaryawan.get(a.karyawan_id) ?? 0) + a.nominal)
  }

  // Find karyawan that already have penggajian for this period
  const { data: existing } = await supabase
    .from("penggajian")
    .select("karyawan_id")
    .eq("periode_mulai", input.periode_mulai)
    .eq("periode_selesai", input.periode_selesai)

  const existingIds = new Set((existing ?? []).map((e) => e.karyawan_id))

  const toInsert = [...byKaryawan.entries()]
    .filter(([karyawan_id]) => !existingIds.has(karyawan_id))
    .map(([karyawan_id, total]) => ({
      karyawan_id,
      periode_mulai: input.periode_mulai,
      periode_selesai: input.periode_selesai,
      total_gaji_kalkulasi: total,
      total_dibayar: total,
      status: "draft" as const,
      dibuat_oleh: profile.id,
    }))

  const skipped = byKaryawan.size - toInsert.length

  if (!toInsert.length) {
    return {
      error: "Semua karyawan sudah memiliki penggajian untuk periode ini",
      count: 0,
      skipped,
    }
  }

  const { error: errInsert } = await supabase.from("penggajian").insert(toInsert)
  if (errInsert) return { error: errInsert.message }

  revalidatePath("/penggajian")
  return { count: toInsert.length, skipped }
}

export async function createPenggajianManual(
  input: TambahPenggajianManualInput
): Promise<{ error?: string }> {
  const profile = await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase.from("penggajian").insert({
    karyawan_id: input.karyawan_id,
    periode_mulai: input.periode_mulai,
    periode_selesai: input.periode_selesai,
    total_gaji_kalkulasi: Number(input.total_gaji_kalkulasi),
    total_dibayar: Number(input.total_dibayar),
    status: "draft",
    catatan: input.catatan || null,
    dibuat_oleh: profile.id,
  })

  if (error) return { error: error.message }
  revalidatePath("/penggajian")
  return {}
}

export async function updatePenggajian(
  id: string,
  input: UpdatePenggajianInput
): Promise<{ error?: string }> {
  await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase
    .from("penggajian")
    .update({
      total_dibayar: Number(input.total_dibayar),
      catatan: input.catatan || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "draft")

  if (error) return { error: error.message }
  revalidatePath("/penggajian")
  revalidatePath(`/penggajian/${id}`)
  return {}
}

export async function tandaiDibayar(id: string): Promise<{ error?: string }> {
  await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase
    .from("penggajian")
    .update({
      status: "dibayar",
      tanggal_bayar: new Date().toISOString().split("T")[0],
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "draft")

  if (error) return { error: error.message }
  revalidatePath("/penggajian")
  revalidatePath(`/penggajian/${id}`)
  return {}
}

export async function deletePenggajian(id: string): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = await createClient()

  const { data: pg } = await supabase
    .from("penggajian")
    .select("status")
    .eq("id", id)
    .single()

  if (pg?.status !== "draft") {
    return { error: "Hanya penggajian berstatus draft yang dapat dihapus" }
  }

  const { error } = await supabase.from("penggajian").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/penggajian")
  return {}
}
