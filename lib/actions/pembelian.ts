"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/actions/auth"
import { generateNoFaktur } from "@/lib/utils"
import type { PembelianInput } from "@/lib/validations/pembelian"
import type { Pembelian, Supplier } from "@/types"
import { syncHPCreate, syncHPUpdate, reverseHP } from "@/lib/actions/hutang-piutang-helper"

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
  input: PembelianInput,
  nota_url?: string | null
): Promise<{ error?: string; id?: string }> {
  const profile = await requireAdmin()
  const supabase = await createClient()

  const no_faktur = generateNoFaktur("PB")
  const total = input.items.reduce(
    (sum, item) => sum + Math.round(Number(item.qty) * Number(item.harga_beli_satuan)),
    0
  )

  const totalDibayar = Number(input.total_dibayar ?? total)

  const { data: pembelian, error: errHeader } = await supabase
    .from("pembelian")
    .insert({
      tanggal: input.tanggal,
      supplier_id: input.supplier_id,
      no_faktur,
      catatan: input.catatan || null,
      total,
      nota_url: nota_url ?? null,
      dibuat_oleh: profile.id,
      total_dibayar: totalDibayar,
    })
    .select("id")
    .single()

  if (errHeader) return { error: errHeader.message }

  const items = input.items.map((item) => ({
    pembelian_id: pembelian.id,
    produk_id: item.produk_id,
    qty: Number(item.qty),
    harga_beli_satuan: Number(item.harga_beli_satuan),
    subtotal: Math.round(Number(item.qty) * Number(item.harga_beli_satuan)),
  }))

  const { error: errItems } = await supabase.from("pembelian_item").insert(items)

  if (errItems) {
    await supabase
      .from("pembelian")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", pembelian.id)
    return { error: errItems.message }
  }

  const { status_bayar } = await syncHPCreate(supabase, {
    transaksiId: pembelian.id,
    sumber: "pembelian",
    pihakTipe: "supplier",
    pihakId: input.supplier_id,
    total,
    totalDibayar,
    tanggal: input.tanggal,
    dibuatOleh: profile.id,
    noFaktur: no_faktur,
  })

  await supabase
    .from("pembelian")
    .update({ status_bayar })
    .eq("id", pembelian.id)

  revalidatePath("/pembelian")
  return { id: pembelian.id }
}

export async function updatePembelian(
  id: string,
  input: PembelianInput,
  nota_url?: string | null
): Promise<{ error?: string }> {
  const profile = await requireAdmin()
  const supabase = await createClient()

  const { data: lama } = await supabase
    .from("pembelian")
    .select("total, total_dibayar, supplier_id, no_faktur")
    .eq("id", id)
    .single()

  const total = input.items.reduce(
    (sum, item) => sum + Math.round(Number(item.qty) * Number(item.harga_beli_satuan)),
    0
  )

  const totalDibayar = Number(input.total_dibayar ?? total)

  const updateData: Record<string, unknown> = {
    tanggal: input.tanggal,
    supplier_id: input.supplier_id,
    catatan: input.catatan || null,
    total,
    total_dibayar: totalDibayar,
    updated_at: new Date().toISOString(),
  }
  if (nota_url !== undefined) updateData.nota_url = nota_url

  const { error: errHeader } = await supabase
    .from("pembelian")
    .update(updateData)
    .eq("id", id)
    .is("deleted_at", null)

  if (errHeader) return { error: errHeader.message }

  await supabase.from("pembelian_item").delete().eq("pembelian_id", id)

  const items = input.items.map((item) => ({
    pembelian_id: id,
    produk_id: item.produk_id,
    qty: Number(item.qty),
    harga_beli_satuan: Number(item.harga_beli_satuan),
    subtotal: Math.round(Number(item.qty) * Number(item.harga_beli_satuan)),
  }))

  const { error: errItems } = await supabase.from("pembelian_item").insert(items)
  if (errItems) return { error: errItems.message }

  const { status_bayar } = await syncHPUpdate(supabase, {
    transaksiId: id,
    sumber: "pembelian",
    pihakTipe: "supplier",
    pihakId: input.supplier_id,
    total,
    totalDibayar,
    totalLama: Number(lama?.total ?? total),
    totalDibayarLama: Number(lama?.total_dibayar ?? total),
    tanggal: input.tanggal,
    dibuatOleh: profile.id,
    noFaktur: lama?.no_faktur ?? null,
  })

  await supabase
    .from("pembelian")
    .update({ status_bayar })
    .eq("id", id)

  revalidatePath("/pembelian")
  return {}
}

export async function deletePembelian(id: string): Promise<{ error?: string }> {
  const profile = await requireAdmin()
  const supabase = await createClient()

  const { data: lama } = await supabase
    .from("pembelian")
    .select("total, total_dibayar, supplier_id, no_faktur")
    .eq("id", id)
    .single()

  const { error } = await supabase
    .from("pembelian")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { error: error.message }

  if (lama) {
    await reverseHP(supabase, {
      transaksiId: id,
      sumber: "pembelian",
      pihakTipe: "supplier",
      pihakId: lama.supplier_id,
      totalLama: Number(lama.total),
      totalDibayarLama: Number(lama.total_dibayar),
      dibuatOleh: profile.id,
      noFaktur: lama.no_faktur,
    })
  }

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
