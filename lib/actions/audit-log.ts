"use server"

import { requireAdmin } from "@/lib/actions/auth"
import { createClient } from "@/lib/supabase/server"

export interface AuditLogRow {
  id: number
  tabel: string
  record_id: string
  aksi: "INSERT" | "UPDATE" | "DELETE"
  dilakukan_oleh: string | null
  dilakukan_pada: string
  nama_user: string | null
}

export async function getAuditLog(limit = 100): Promise<AuditLogRow[]> {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("audit_log")
    .select("id, tabel, record_id, aksi, dilakukan_oleh, dilakukan_pada, profiles(nama)")
    .order("dilakukan_pada", { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => ({
    id: row.id,
    tabel: row.tabel,
    record_id: row.record_id,
    aksi: row.aksi as AuditLogRow["aksi"],
    dilakukan_oleh: row.dilakukan_oleh,
    dilakukan_pada: row.dilakukan_pada,
    nama_user: (row.profiles as unknown as { nama: string | null } | null)?.nama ?? null,
  }))
}
