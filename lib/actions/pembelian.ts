"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/actions/auth"
import { generateNoFaktur } from "@/lib/utils"
import type { PembelianInput } from "@/lib/validations/pembelian"
import type { Pembelian, Supplier } from "@/types"

export interface PembelianFilters {
  tanggal_dari?: string
  tanggal_sampai?: string
  supplier_id?: string
}

export async function getPembelians(filters?: PembelianFilters): Promise<Pembelian[]> {
  await requireAdmin()
  const supabase = await createClient()

  let q = supabase
    .from("pembelian")
    .select("*, supplier(id, nama)")
    .is("deleted_at", null)
    .order("tanggal", { ascending: false })
    .order("created_at", { ascending: false })

  if (filters?.tanggal_dari) q = q.gte("tanggal", filters.tanggal_dari)
  if (filters?.tanggal_sampai) q = q.lte("tanggal", filters.tanggal_sampai)
  if (filters?.supplier_id) q = q.eq("supplier_id", filters.supplier_id)

  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []) as Pembelian[]
}

export async function getPembelianById(id: string): Promise<Pembelian | null> {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("pembelian")
    .select("*, supplier(id, nama), pembelian_item(*, produk(id, nama, satuan))")
    .eq("id", id)
    .is("deleted_at", null)
    .single()

  if (error) return null
  return data as Pembelian
}

export async function createPembelian(
  input: PembelianInput
): Promise<{ error?: string; id?: string }> {
  const profile = await requireAdmin()
  const supabase = await createClient()

  const no_faktur = input.no_faktur?.trim() || generateNoFaktur("PB")
  const total = input.items.reduce(
    (sum, item) => sum + Number(item.qty) * Number(item.harga_beli_satuan),
    0
  )

  const { data: pembelian, error: errHeader } = await supabase
    .from("pembelian")
    .insert({
      tanggal: input.tanggal,
      supplier_id: input.supplier_id,
      no_faktur,
      catatan: input.catatan || null,
      total,
      dibuat_oleh: profile.id,
    })
    .select("id")
    .single()

  if (errHeader) return { error: errHeader.message }

  const items = input.items.map((item) => ({
    pembelian_id: pembelian.id,
    produk_id: item.produk_id,
    qty: Number(item.qty),
    harga_beli_satuan: Number(item.harga_beli_satuan),
    subtotal: Number(item.qty) * Number(item.harga_beli_satuan),
  }))

  const { error: errItems } = await supabase.from("pembelian_item").insert(items)

  if (errItems) {
    await supabase
      .from("pembelian")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", pembelian.id)
    return { error: errItems.message }
  }

  revalidatePath("/pembelian")
  return { id: pembelian.id }
}

export async function updatePembelian(
  id: string,
  input: PembelianInput
): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = await createClient()

  const total = input.items.reduce(
    (sum, item) => sum + Number(item.qty) * Number(item.harga_beli_satuan),
    0
  )

  const { error: errHeader } = await supabase
    .from("pembelian")
    .update({
      tanggal: input.tanggal,
      supplier_id: input.supplier_id,
      no_faktur: input.no_faktur?.trim() || null,
      catatan: input.catatan || null,
      total,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("deleted_at", null)

  if (errHeader) return { error: errHeader.message }

  await supabase.from("pembelian_item").delete().eq("pembelian_id", id)

  const items = input.items.map((item) => ({
    pembelian_id: id,
    produk_id: item.produk_id,
    qty: Number(item.qty),
    harga_beli_satuan: Number(item.harga_beli_satuan),
    subtotal: Number(item.qty) * Number(item.harga_beli_satuan),
  }))

  const { error: errItems } = await supabase.from("pembelian_item").insert(items)
  if (errItems) return { error: errItems.message }

  revalidatePath("/pembelian")
  return {}
}

export async function deletePembelian(id: string): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("pembelian")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/pembelian")
  return {}
}

export async function getSupplierOptions(): Promise<Supplier[]> {
  await requireAdmin()
  const supabase = await createClient()
  const { data } = await supabase
    .from("supplier")
    .select("id, nama")
    .is("deleted_at", null)
    .order("nama")
  return (data ?? []) as Supplier[]
}
