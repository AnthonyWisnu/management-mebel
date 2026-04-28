"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin, requireAuth } from "@/lib/actions/auth"
import { generateNoFaktur } from "@/lib/utils"
import type { PurchaseOrderInput } from "@/lib/validations/purchase-order"
import type { PurchaseOrder, Pelanggan, StatusPO } from "@/types"

export interface POFilters {
  status?: StatusPO
  pelanggan_id?: string
}

export async function getPurchaseOrders(filters?: POFilters): Promise<PurchaseOrder[]> {
  await requireAuth()
  const supabase = await createClient()

  let q = supabase
    .from("purchase_order")
    .select("*, pelanggan(id, nama, no_telp)")
    .is("deleted_at", null)
    .order("batas_waktu", { ascending: true })
    .order("created_at", { ascending: false })

  if (filters?.status) q = q.eq("status", filters.status)
  if (filters?.pelanggan_id) q = q.eq("pelanggan_id", filters.pelanggan_id)

  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []) as PurchaseOrder[]
}

export async function getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
  await requireAuth()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("purchase_order")
    .select("*, pelanggan(id, nama, no_telp), purchase_order_item(*)")
    .eq("id", id)
    .is("deleted_at", null)
    .single()

  if (error) return null
  return data as PurchaseOrder
}

export async function createPurchaseOrder(
  input: PurchaseOrderInput
): Promise<{ error?: string; id?: string }> {
  const profile = await requireAdmin()
  const supabase = await createClient()

  const no_po = generateNoFaktur("PO")

  const { data: po, error: errHeader } = await supabase
    .from("purchase_order")
    .insert({
      no_po,
      tanggal_po: input.tanggal_po,
      batas_waktu: input.batas_waktu,
      pelanggan_id: input.pelanggan_id,
      status: input.status ?? "pending",
      catatan: input.catatan || null,
      dibuat_oleh: profile.id,
    })
    .select("id")
    .single()

  if (errHeader) return { error: errHeader.message }

  const items = input.items.map((item) => ({
    po_id: po.id,
    deskripsi: item.deskripsi,
    qty: Number(item.qty),
    harga_satuan: Number(item.harga_satuan),
    catatan: item.catatan || null,
  }))

  const { error: errItems } = await supabase.from("purchase_order_item").insert(items)

  if (errItems) {
    await supabase
      .from("purchase_order")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", po.id)
    return { error: errItems.message }
  }

  revalidatePath("/purchase-order")
  return { id: po.id }
}

export async function updatePurchaseOrder(
  id: string,
  input: PurchaseOrderInput
): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = await createClient()

  const { error: errHeader } = await supabase
    .from("purchase_order")
    .update({
      tanggal_po: input.tanggal_po,
      batas_waktu: input.batas_waktu,
      pelanggan_id: input.pelanggan_id,
      status: input.status,
      catatan: input.catatan || null,
    })
    .eq("id", id)
    .is("deleted_at", null)

  if (errHeader) return { error: errHeader.message }

  await supabase.from("purchase_order_item").delete().eq("po_id", id)

  const items = input.items.map((item) => ({
    po_id: id,
    deskripsi: item.deskripsi,
    qty: Number(item.qty),
    harga_satuan: Number(item.harga_satuan),
    catatan: item.catatan || null,
  }))

  const { error: errItems } = await supabase.from("purchase_order_item").insert(items)
  if (errItems) return { error: errItems.message }

  revalidatePath("/purchase-order")
  revalidatePath(`/purchase-order/${id}`)
  return {}
}

export async function updatePOStatus(
  id: string,
  status: StatusPO
): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("purchase_order")
    .update({ status })
    .eq("id", id)
    .is("deleted_at", null)

  if (error) return { error: error.message }

  revalidatePath("/purchase-order")
  revalidatePath(`/purchase-order/${id}`)
  return {}
}

export async function deletePurchaseOrder(id: string): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("purchase_order")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/purchase-order")
  return {}
}

export async function getPelangganOptions(): Promise<Pick<Pelanggan, "id" | "nama">[]> {
  await requireAuth()
  const supabase = await createClient()
  const { data } = await supabase
    .from("pelanggan")
    .select("id, nama")
    .is("deleted_at", null)
    .order("nama")
  return (data ?? []) as Pick<Pelanggan, "id" | "nama">[]
}
