"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin, requireAuth } from "@/lib/actions/auth"
import { generateNoFaktur } from "@/lib/utils"
import type { PenjualanInput } from "@/lib/validations/penjualan"
import type { Penjualan, Pelanggan } from "@/types"

export interface PenjualanFilters {
  tanggal_dari?: string
  tanggal_sampai?: string
  pelanggan_id?: string
}

export async function getPenjualans(filters?: PenjualanFilters): Promise<Penjualan[]> {
  await requireAuth()
  const supabase = await createClient()

  let q = supabase
    .from("penjualan")
    .select("*, pelanggan(id, nama)")
    .is("deleted_at", null)
    .order("tanggal", { ascending: false })
    .order("created_at", { ascending: false })

  if (filters?.tanggal_dari) q = q.gte("tanggal", filters.tanggal_dari)
  if (filters?.tanggal_sampai) q = q.lte("tanggal", filters.tanggal_sampai)
  if (filters?.pelanggan_id) q = q.eq("pelanggan_id", filters.pelanggan_id)

  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []) as Penjualan[]
}

export async function getPenjualanById(id: string): Promise<Penjualan | null> {
  await requireAuth()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("penjualan")
    .select("*, pelanggan(id, nama), penjualan_item(*, produk(id, nama, satuan))")
    .eq("id", id)
    .is("deleted_at", null)
    .single()

  if (error) return null
  return data as Penjualan
}

async function validateStok(
  supabase: Awaited<ReturnType<typeof createClient>>,
  items: PenjualanInput["items"],
  releaseQtyMap?: Map<string, number>
): Promise<{ error?: string }> {
  const produkIds = [...new Set(items.map((i) => i.produk_id))]
  const { data: produkList } = await supabase
    .from("produk")
    .select("id, nama, stok, satuan")
    .in("id", produkIds)

  const produkMap = new Map((produkList ?? []).map((p) => [p.id, p]))

  for (const item of items) {
    const produk = produkMap.get(item.produk_id)
    if (!produk) return { error: "Produk tidak ditemukan" }
    const released = releaseQtyMap?.get(item.produk_id) ?? 0
    const effectiveStok = Number(produk.stok) + released
    if (effectiveStok < Number(item.qty)) {
      return {
        error: `Stok ${produk.nama} tidak cukup (tersedia: ${effectiveStok} ${produk.satuan}, dibutuhkan: ${item.qty})`,
      }
    }
  }
  return {}
}

export async function createPenjualan(
  input: PenjualanInput,
  nota_url?: string | null
): Promise<{ error?: string; id?: string }> {
  const profile = await requireAuth()
  const supabase = await createClient()
  const isAdmin = profile.role === "admin"

  const stokError = await validateStok(supabase, input.items)
  if (stokError.error) return stokError

  const no_faktur = input.no_faktur?.trim() || generateNoFaktur("PJ")

  const total_penjualan = input.items.reduce(
    (sum, item) => sum + Number(item.qty) * Number(item.harga_jual_satuan),
    0
  )
  const total_hpp = isAdmin
    ? input.items.reduce(
        (sum, item) => sum + Number(item.qty) * Number(item.hpp_satuan ?? 0),
        0
      )
    : 0

  const { data: penjualan, error: errHeader } = await supabase
    .from("penjualan")
    .insert({
      tanggal: input.tanggal,
      pelanggan_id: input.pelanggan_id,
      no_faktur,
      catatan: input.catatan || null,
      total_penjualan,
      total_hpp,
      nota_url: nota_url ?? null,
      dibuat_oleh: profile.id,
    })
    .select("id")
    .single()

  if (errHeader) return { error: errHeader.message }

  const items = input.items.map((item) => ({
    penjualan_id: penjualan.id,
    produk_id: item.produk_id,
    qty: Number(item.qty),
    harga_jual_satuan: Number(item.harga_jual_satuan),
    hpp_satuan: isAdmin ? Number(item.hpp_satuan ?? 0) : 0,
    subtotal_jual: Number(item.qty) * Number(item.harga_jual_satuan),
    subtotal_hpp: isAdmin
      ? Number(item.qty) * Number(item.hpp_satuan ?? 0)
      : 0,
  }))

  const { error: errItems } = await supabase.from("penjualan_item").insert(items)

  if (errItems) {
    await supabase
      .from("penjualan")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", penjualan.id)
    return { error: errItems.message }
  }

  revalidatePath("/penjualan")
  return { id: penjualan.id }
}

export async function updatePenjualan(
  id: string,
  input: PenjualanInput,
  nota_url?: string | null
): Promise<{ error?: string }> {
  const profile = await requireAuth()
  const supabase = await createClient()
  const isAdmin = profile.role === "admin"

  // Validasi stok dengan memperhitungkan item lama yang akan dibebaskan
  const { data: oldItems } = await supabase
    .from("penjualan_item")
    .select("produk_id, qty")
    .eq("penjualan_id", id)

  const releaseQtyMap = new Map<string, number>()
  for (const item of oldItems ?? []) {
    releaseQtyMap.set(item.produk_id, (releaseQtyMap.get(item.produk_id) ?? 0) + Number(item.qty))
  }

  const stokError = await validateStok(supabase, input.items, releaseQtyMap)
  if (stokError.error) return stokError

  const total_penjualan = input.items.reduce(
    (sum, item) => sum + Number(item.qty) * Number(item.harga_jual_satuan),
    0
  )

  let total_hpp: number
  if (isAdmin) {
    total_hpp = input.items.reduce(
      (sum, item) => sum + Number(item.qty) * Number(item.hpp_satuan ?? 0),
      0
    )
  } else {
    // Pegawai: ambil total_hpp yang sudah ada di database
    const { data: existing } = await supabase
      .from("penjualan")
      .select("total_hpp")
      .eq("id", id)
      .single()
    total_hpp = existing?.total_hpp ?? 0
  }

  const updateData: Record<string, unknown> = {
    tanggal: input.tanggal,
    pelanggan_id: input.pelanggan_id,
    no_faktur: input.no_faktur?.trim() || null,
    catatan: input.catatan || null,
    total_penjualan,
    total_hpp,
    updated_at: new Date().toISOString(),
  }
  if (nota_url !== undefined) updateData.nota_url = nota_url

  const { error: errHeader } = await supabase
    .from("penjualan")
    .update(updateData)
    .eq("id", id)
    .is("deleted_at", null)

  if (errHeader) return { error: errHeader.message }

  // Hapus semua item lama, ganti dengan yang baru
  await supabase.from("penjualan_item").delete().eq("penjualan_id", id)

  const items = input.items.map((item) => ({
    penjualan_id: id,
    produk_id: item.produk_id,
    qty: Number(item.qty),
    harga_jual_satuan: Number(item.harga_jual_satuan),
    hpp_satuan: isAdmin ? Number(item.hpp_satuan ?? 0) : 0,
    subtotal_jual: Number(item.qty) * Number(item.harga_jual_satuan),
    subtotal_hpp: isAdmin
      ? Number(item.qty) * Number(item.hpp_satuan ?? 0)
      : 0,
  }))

  const { error: errItems } = await supabase.from("penjualan_item").insert(items)
  if (errItems) return { error: errItems.message }

  revalidatePath("/penjualan")
  return {}
}

export async function deletePenjualan(id: string): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("penjualan")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/penjualan")
  return {}
}

export async function getPelangganOptions(): Promise<Pelanggan[]> {
  await requireAuth()
  const supabase = await createClient()
  const { data } = await supabase
    .from("pelanggan")
    .select("id, nama")
    .is("deleted_at", null)
    .order("nama")
  return (data ?? []) as Pelanggan[]
}
