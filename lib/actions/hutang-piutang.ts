"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/actions/auth"
import { CatatPembayaranSchema, type CatatPembayaranInput } from "@/lib/validations/hutang-piutang"
import type { HutangPiutang, StatusBayar } from "@/types"

export interface HutangPiutangFilters {
  tipe?: "hutang" | "piutang"
  status?: StatusBayar
  dari?: string
  sampai?: string
  pihak_id?: string
}

export async function getHutangPiutang(
  filter: HutangPiutangFilters = {}
): Promise<HutangPiutang[]> {
  await requireAdmin()
  const supabase = await createClient()

  let q = supabase
    .from("hutang_piutang")
    .select("*, pelanggan(id, nama), supplier(id, nama)")
    .is("deleted_at", null)
    .order("tanggal", { ascending: false })
    .order("created_at", { ascending: false })

  if (filter.tipe) q = q.eq("tipe", filter.tipe)
  if (filter.status) q = q.eq("status", filter.status)
  if (filter.dari) q = q.gte("tanggal", filter.dari)
  if (filter.sampai) q = q.lte("tanggal", filter.sampai)
  if (filter.pihak_id) {
    q = q.or(`pelanggan_id.eq.${filter.pihak_id},supplier_id.eq.${filter.pihak_id}`)
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)

  return ((data ?? []) as HutangPiutang[]).map((hp) => ({
    ...hp,
    sisa: Number(hp.nominal) - Number(hp.terbayar),
  }))
}

export async function catatPembayaran(
  id: string,
  input: CatatPembayaranInput
): Promise<{ error?: string }> {
  const profile = await requireAdmin()
  const supabase = await createClient()

  const parsed = CatatPembayaranSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  const { data: hp } = await supabase
    .from("hutang_piutang")
    .select("id, nominal, terbayar, status")
    .eq("id", id)
    .is("deleted_at", null)
    .single()

  if (!hp) return { error: "Data hutang/piutang tidak ditemukan" }
  if (hp.status === "lunas") return { error: "Hutang/piutang ini sudah lunas" }

  const sisa = Number(hp.nominal) - Number(hp.terbayar)
  if (parsed.data.jumlah > sisa) {
    return { error: `Jumlah melebihi sisa (sisa: ${sisa})` }
  }

  const { error: errInsert } = await supabase.from("pembayaran_hp").insert({
    hutang_piutang_id: id,
    jumlah: parsed.data.jumlah,
    tanggal: parsed.data.tanggal,
    catatan: parsed.data.catatan || null,
    dibuat_oleh: profile.id,
  })
  if (errInsert) return { error: errInsert.message }

  const terbayarBaru = Number(hp.terbayar) + parsed.data.jumlah
  const statusBaru: StatusBayar =
    terbayarBaru >= Number(hp.nominal)
      ? "lunas"
      : terbayarBaru > 0
        ? "sebagian"
        : "belum_lunas"

  const { error: errUpdate } = await supabase
    .from("hutang_piutang")
    .update({ terbayar: terbayarBaru, status: statusBaru, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (errUpdate) return { error: errUpdate.message }

  revalidatePath("/hutang-piutang")
  revalidatePath("/penjualan")
  revalidatePath("/pembelian")
  return {}
}

export async function getRiwayatSaldoKredit(
  pihakTipe: "pelanggan" | "supplier",
  pihakId: string
) {
  await requireAdmin()
  const supabase = await createClient()

  const q = pihakTipe === "pelanggan"
    ? supabase.from("riwayat_saldo_kredit").select("*").eq("pelanggan_id", pihakId)
    : supabase.from("riwayat_saldo_kredit").select("*").eq("supplier_id", pihakId)

  const { data } = await q.order("created_at", { ascending: false }).limit(50)
  return data ?? []
}
