"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import type { AuditLogRow } from "@/lib/actions/audit-log"

const TABEL_LABEL: Record<string, string> = {
  penjualan: "Penjualan",
  pembelian: "Pembelian",
  penggajian: "Penggajian",
}

const AKSI_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  INSERT: "default",
  UPDATE: "secondary",
  DELETE: "destructive",
}

const AKSI_LABEL: Record<string, string> = {
  INSERT: "Buat",
  UPDATE: "Ubah",
  DELETE: "Hapus",
}

function fmtWaktu(dateStr: string) {
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface AuditLogClientProps {
  rows: AuditLogRow[]
}

export function AuditLogClient({ rows }: AuditLogClientProps) {
  const [search, setSearch] = useState("")

  const filtered = search.trim()
    ? rows.filter(
        (r) =>
          (TABEL_LABEL[r.tabel] ?? r.tabel).toLowerCase().includes(search.toLowerCase()) ||
          (r.nama_user ?? "").toLowerCase().includes(search.toLowerCase()) ||
          r.aksi.toLowerCase().includes(search.toLowerCase())
      )
    : rows

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Cari tabel, user, atau aksi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} entri
        </span>
      </div>

      {/* Desktop tabel */}
      <div className="hidden md:block rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Waktu</th>
              <th className="px-4 py-3 text-left font-semibold">Tabel</th>
              <th className="px-4 py-3 text-left font-semibold">Aksi</th>
              <th className="px-4 py-3 text-left font-semibold">Dilakukan Oleh</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Record ID</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  Belum ada riwayat aktivitas
                </td>
              </tr>
            )}
            {filtered.map((row) => (
              <tr key={row.id} className="border-t hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                  {fmtWaktu(row.dilakukan_pada)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{TABEL_LABEL[row.tabel] ?? row.tabel}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={AKSI_VARIANT[row.aksi] ?? "secondary"}>
                    {AKSI_LABEL[row.aksi] ?? row.aksi}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {row.nama_user ?? <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground truncate max-w-[180px]">
                  {row.record_id}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile kartu */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            Belum ada riwayat aktivitas
          </p>
        )}
        {filtered.map((row) => (
          <Card key={row.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{TABEL_LABEL[row.tabel] ?? row.tabel}</Badge>
                  <Badge variant={AKSI_VARIANT[row.aksi] ?? "secondary"}>
                    {AKSI_LABEL[row.aksi] ?? row.aksi}
                  </Badge>
                </div>
              </div>
              <div className="text-sm space-y-1">
                <p className="text-muted-foreground text-xs">{fmtWaktu(row.dilakukan_pada)}</p>
                <p>
                  <span className="text-muted-foreground">Oleh: </span>
                  {row.nama_user ?? "—"}
                </p>
                <p className="font-mono text-xs text-muted-foreground truncate">{row.record_id}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
