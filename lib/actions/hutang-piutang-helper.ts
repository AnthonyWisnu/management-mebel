import { createClient } from "@/lib/supabase/server"

type PihakTipe = "pelanggan" | "supplier"
type Sumber = "penjualan" | "pembelian"

interface SyncHPInput {
  transaksiId: string
  sumber: Sumber
  pihakTipe: PihakTipe
  pihakId: string
  total: number
  totalDibayar: number
  tanggal: string
  dibuatOleh: string
  noFaktur?: string | null
}

export async function syncHPCreate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: SyncHPInput
): Promise<{ status_bayar: "lunas" | "sebagian" | "belum_lunas" }> {
  const selisih = Math.round(input.total - input.totalDibayar)

  if (selisih === 0) return { status_bayar: "lunas" }

  if (selisih < 0) {
    const overpay = Math.abs(selisih)
    await tambahSaldoKredit(supabase, {
      pihakTipe: input.pihakTipe,
      pihakId: input.pihakId,
      jumlah: overpay,
      keterangan: `Overpayment ${input.noFaktur ?? input.transaksiId}`,
      sumber: input.sumber,
      sumberId: input.transaksiId,
      dibuatOleh: input.dibuatOleh,
    })
    return { status_bayar: "lunas" }
  }

  const saldoKredit = await getSaldoKredit(supabase, input.pihakTipe, input.pihakId)
  const saldoTerpakai = Math.min(saldoKredit, selisih)
  const sisaHutang = selisih - saldoTerpakai

  if (saldoTerpakai > 0) {
    await kurangiSaldoKredit(supabase, {
      pihakTipe: input.pihakTipe,
      pihakId: input.pihakId,
      jumlah: saldoTerpakai,
      keterangan: `Auto-apply ke ${input.noFaktur ?? input.transaksiId}`,
      sumber: input.sumber,
      sumberId: input.transaksiId,
      dibuatOleh: input.dibuatOleh,
    })
  }

  if (sisaHutang > 0) {
    const tipe = input.sumber === "penjualan" ? "piutang" : "hutang"
    await supabase.from("hutang_piutang").insert({
      tipe,
      sumber: input.sumber,
      sumber_id: input.transaksiId,
      pihak_tipe: input.pihakTipe,
      [`${input.pihakTipe}_id`]: input.pihakId,
      nominal: sisaHutang,
      saldo_terpakai: saldoTerpakai,
      terbayar: 0,
      status: input.totalDibayar === 0 ? "belum_lunas" : "sebagian",
      tanggal: input.tanggal,
      dibuat_oleh: input.dibuatOleh,
    })
  }

  const status_bayar =
    sisaHutang === 0
      ? "lunas"
      : input.totalDibayar === 0
        ? "belum_lunas"
        : "sebagian"

  return { status_bayar }
}

export async function syncHPUpdate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: SyncHPInput & { totalLama: number; totalDibayarLama: number }
): Promise<{ status_bayar: "lunas" | "sebagian" | "belum_lunas" }> {
  await reverseHP(supabase, {
    transaksiId: input.transaksiId,
    sumber: input.sumber,
    pihakTipe: input.pihakTipe,
    pihakId: input.pihakId,
    dibuatOleh: input.dibuatOleh,
    totalLama: input.totalLama,
    totalDibayarLama: input.totalDibayarLama,
    noFaktur: input.noFaktur,
  })
  return syncHPCreate(supabase, input)
}

export async function reverseHP(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: Pick<SyncHPInput, "transaksiId" | "sumber" | "pihakTipe" | "pihakId" | "dibuatOleh"> & {
    totalLama: number
    totalDibayarLama: number
    noFaktur?: string | null
  }
) {
  const selisihLama = Math.round(input.totalLama - input.totalDibayarLama)

  if (selisihLama < 0) {
    const overpay = Math.abs(selisihLama)
    await kurangiSaldoKredit(supabase, {
      pihakTipe: input.pihakTipe,
      pihakId: input.pihakId,
      jumlah: overpay,
      keterangan: `Reverse overpayment ${input.noFaktur ?? input.transaksiId}`,
      sumber: input.sumber,
      sumberId: input.transaksiId,
      dibuatOleh: input.dibuatOleh,
    })
  } else if (selisihLama > 0) {
    const { data: hp } = await supabase
      .from("hutang_piutang")
      .select("id, saldo_terpakai")
      .eq("sumber_id", input.transaksiId)
      .is("deleted_at", null)
      .single()

    if (hp) {
      await supabase
        .from("hutang_piutang")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", hp.id)

      if (hp.saldo_terpakai > 0) {
        await tambahSaldoKredit(supabase, {
          pihakTipe: input.pihakTipe,
          pihakId: input.pihakId,
          jumlah: hp.saldo_terpakai,
          keterangan: `Restore saldo dari reverse ${input.noFaktur ?? input.transaksiId}`,
          sumber: input.sumber,
          sumberId: input.transaksiId,
          dibuatOleh: input.dibuatOleh,
        })
      }
    }
  }
}

// ─── Internal helpers ────────────────────────────────────────────────────────

async function getSaldoKredit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  pihakTipe: PihakTipe,
  pihakId: string
): Promise<number> {
  const tabel = pihakTipe === "pelanggan" ? "pelanggan" : "supplier"
  const { data } = await supabase
    .from(tabel)
    .select("saldo_kredit")
    .eq("id", pihakId)
    .single()
  return Number(data?.saldo_kredit ?? 0)
}

interface UbahSaldoInput {
  pihakTipe: PihakTipe
  pihakId: string
  jumlah: number
  keterangan: string
  sumber: Sumber | "pembayaran_hp" | "manual"
  sumberId?: string
  dibuatOleh: string
}

async function tambahSaldoKredit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: UbahSaldoInput
) {
  const tabel = input.pihakTipe === "pelanggan" ? "pelanggan" : "supplier"
  const { data: current } = await supabase
    .from(tabel)
    .select("saldo_kredit")
    .eq("id", input.pihakId)
    .single()
  const saldoSebelum = Number(current?.saldo_kredit ?? 0)
  const saldoSesudah = saldoSebelum + input.jumlah

  await supabase.from(tabel).update({ saldo_kredit: saldoSesudah }).eq("id", input.pihakId)

  await supabase.from("riwayat_saldo_kredit").insert({
    pihak_tipe: input.pihakTipe,
    [`${input.pihakTipe}_id`]: input.pihakId,
    jumlah: input.jumlah,
    saldo_sebelum: saldoSebelum,
    saldo_sesudah: saldoSesudah,
    keterangan: input.keterangan,
    sumber: input.sumber,
    sumber_id: input.sumberId ?? null,
    dibuat_oleh: input.dibuatOleh,
  })
}

async function kurangiSaldoKredit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: UbahSaldoInput
) {
  const tabel = input.pihakTipe === "pelanggan" ? "pelanggan" : "supplier"
  const { data: current } = await supabase
    .from(tabel)
    .select("saldo_kredit")
    .eq("id", input.pihakId)
    .single()
  const saldoSebelum = Number(current?.saldo_kredit ?? 0)
  const saldoSesudah = Math.max(0, saldoSebelum - input.jumlah)

  await supabase.from(tabel).update({ saldo_kredit: saldoSesudah }).eq("id", input.pihakId)

  await supabase.from("riwayat_saldo_kredit").insert({
    pihak_tipe: input.pihakTipe,
    [`${input.pihakTipe}_id`]: input.pihakId,
    jumlah: -input.jumlah,
    saldo_sebelum: saldoSebelum,
    saldo_sesudah: saldoSesudah,
    keterangan: input.keterangan,
    sumber: input.sumber,
    sumber_id: input.sumberId ?? null,
    dibuat_oleh: input.dibuatOleh,
  })
}
