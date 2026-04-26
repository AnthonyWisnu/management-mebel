import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

function fmtRupiah(v: number) {
  return "Rp " + Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

function fmtTgl(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
}

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, padding: 32, color: "#1a1a1a" },
  header: { marginBottom: 16, borderBottom: "1.5 solid #e5e7eb", paddingBottom: 10 },
  company: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  title: { fontSize: 11, color: "#374151", marginTop: 4 },
  meta: { fontSize: 8, color: "#6b7280", marginTop: 2 },
  table: { marginTop: 10 },
  tableHead: { flexDirection: "row", backgroundColor: "#f3f4f6", padding: "5 4", borderRadius: 2 },
  tableRow: { flexDirection: "row", padding: "4 4", borderBottom: "0.5 solid #e5e7eb" },
  thLabel: { fontFamily: "Helvetica-Bold", fontSize: 8 },
  cell: { fontSize: 8 },
  footer: { marginTop: 20, borderTop: "0.5 solid #e5e7eb", paddingTop: 6, color: "#9ca3af", fontSize: 7 },
  summaryRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10, gap: 8 },
  summaryLabel: { color: "#6b7280", fontSize: 9 },
  summaryValue: { fontFamily: "Helvetica-Bold", fontSize: 9 },
})

// ─── Generik kolom ───────────────────────────────────────────────────────────

interface Col {
  header: string
  flex: number
  align?: "right" | "left"
}

interface GenericTableProps {
  cols: Col[]
  rows: string[][]
}

function GenericTable({ cols, rows }: GenericTableProps) {
  return (
    <View style={s.table}>
      <View style={s.tableHead}>
        {cols.map((col, i) => (
          <Text
            key={i}
            style={[
              s.thLabel,
              { flex: col.flex, textAlign: col.align === "right" ? "right" : "left" },
            ]}
          >
            {col.header}
          </Text>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={s.tableRow}>
          {row.map((cell, ci) => (
            <Text
              key={ci}
              style={[
                s.cell,
                {
                  flex: cols[ci]?.flex ?? 1,
                  textAlign: cols[ci]?.align === "right" ? "right" : "left",
                },
              ]}
            >
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  )
}

// ─── Laporan Penjualan ────────────────────────────────────────────────────────

import type { LaporanPenjualanRow } from "@/lib/actions/laporan"

interface LaporanPenjualanPDFProps {
  data: LaporanPenjualanRow[]
  isAdmin: boolean
  periode: string
}

export function LaporanPenjualanPDF({ data, isAdmin, periode }: LaporanPenjualanPDFProps) {
  const cols: Col[] = [
    { header: "No Faktur", flex: 1.5 },
    { header: "Tanggal", flex: 1 },
    { header: "Pelanggan", flex: 1.5 },
    { header: "Produk", flex: 2 },
    { header: "Qty", flex: 0.6, align: "right" },
    { header: "Harga Jual", flex: 1.5, align: "right" },
    { header: "Subtotal", flex: 1.5, align: "right" },
    ...(isAdmin ? [{ header: "HPP", flex: 1.5, align: "right" as const }] : []),
  ]

  const rows = data.map((r) => [
    r.no_faktur ?? "—",
    fmtTgl(r.tanggal),
    r.pelanggan_nama,
    r.produk_nama,
    r.qty.toString(),
    fmtRupiah(r.harga_jual_satuan),
    fmtRupiah(r.subtotal_jual),
    ...(isAdmin ? [fmtRupiah(r.subtotal_hpp)] : []),
  ])

  const totalJual = data.reduce((s, r) => s + r.subtotal_jual, 0)
  const totalHpp = data.reduce((s, r) => s + r.subtotal_hpp, 0)

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={s.header}>
          <Text style={s.company}>Mebel Manager</Text>
          <Text style={s.title}>Laporan Penjualan</Text>
          <Text style={s.meta}>Periode: {periode}</Text>
        </View>
        <GenericTable cols={cols} rows={rows} />
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>Total Penjualan:</Text>
          <Text style={s.summaryValue}>{fmtRupiah(totalJual)}</Text>
          {isAdmin && (
            <>
              <Text style={[s.summaryLabel, { marginLeft: 16 }]}>Total HPP:</Text>
              <Text style={s.summaryValue}>{fmtRupiah(totalHpp)}</Text>
            </>
          )}
        </View>
        <Text style={s.footer}>Dicetak pada {new Date().toLocaleDateString("id-ID")}</Text>
      </Page>
    </Document>
  )
}

// ─── Laporan Pembelian ────────────────────────────────────────────────────────

import type { LaporanPembelianRow } from "@/lib/actions/laporan"

interface LaporanPembelianPDFProps {
  data: LaporanPembelianRow[]
  periode: string
}

export function LaporanPembelianPDF({ data, periode }: LaporanPembelianPDFProps) {
  const cols: Col[] = [
    { header: "No Faktur", flex: 1.5 },
    { header: "Tanggal", flex: 1 },
    { header: "Supplier", flex: 1.5 },
    { header: "Produk", flex: 2 },
    { header: "Qty", flex: 0.6, align: "right" },
    { header: "Harga Beli", flex: 1.5, align: "right" },
    { header: "Subtotal", flex: 1.5, align: "right" },
  ]
  const rows = data.map((r) => [
    r.no_faktur ?? "—",
    fmtTgl(r.tanggal),
    r.supplier_nama,
    r.produk_nama,
    r.qty.toString(),
    fmtRupiah(r.harga_beli_satuan),
    fmtRupiah(r.subtotal),
  ])
  const total = data.reduce((s, r) => s + r.subtotal, 0)

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={s.header}>
          <Text style={s.company}>Mebel Manager</Text>
          <Text style={s.title}>Laporan Pembelian</Text>
          <Text style={s.meta}>Periode: {periode}</Text>
        </View>
        <GenericTable cols={cols} rows={rows} />
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>Total:</Text>
          <Text style={s.summaryValue}>{fmtRupiah(total)}</Text>
        </View>
        <Text style={s.footer}>Dicetak pada {new Date().toLocaleDateString("id-ID")}</Text>
      </Page>
    </Document>
  )
}

// ─── Laporan Profit ───────────────────────────────────────────────────────────

import type { LaporanProfitRow } from "@/lib/actions/laporan"

interface LaporanProfitPDFProps {
  data: LaporanProfitRow[]
  periode: string
}

export function LaporanProfitPDF({ data, periode }: LaporanProfitPDFProps) {
  const cols: Col[] = [
    { header: "Tanggal", flex: 1 },
    { header: "Total Penjualan", flex: 1.5, align: "right" },
    { header: "Total HPP", flex: 1.5, align: "right" },
    { header: "Total Pembelian", flex: 1.5, align: "right" },
    { header: "Total Penggajian", flex: 1.5, align: "right" },
    { header: "Profit Bersih", flex: 1.5, align: "right" },
  ]
  const rows = data.map((r) => [
    fmtTgl(r.tanggal),
    fmtRupiah(r.total_penjualan),
    fmtRupiah(r.total_hpp),
    fmtRupiah(r.total_pembelian),
    fmtRupiah(r.total_penggajian),
    fmtRupiah(r.profit_bersih),
  ])
  const totalProfit = data.reduce((s, r) => s + r.profit_bersih, 0)

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={s.header}>
          <Text style={s.company}>Mebel Manager</Text>
          <Text style={s.title}>Laporan Profit</Text>
          <Text style={s.meta}>Periode: {periode}</Text>
        </View>
        <GenericTable cols={cols} rows={rows} />
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>Total Profit Bersih:</Text>
          <Text style={s.summaryValue}>{fmtRupiah(totalProfit)}</Text>
        </View>
        <Text style={s.footer}>Dicetak pada {new Date().toLocaleDateString("id-ID")}</Text>
      </Page>
    </Document>
  )
}

// ─── Laporan Absensi ─────────────────────────────────────────────────────────

import type { LaporanAbsensiRow } from "@/lib/actions/laporan"

const TIPE_SHIFT_LABEL: Record<string, string> = {
  setengah_hari: "1/2 Hari",
  satu_hari: "1 Hari",
  lembur: "Lembur",
}

interface LaporanAbsensiPDFProps {
  data: LaporanAbsensiRow[]
  periode: string
}

export function LaporanAbsensiPDF({ data, periode }: LaporanAbsensiPDFProps) {
  const cols: Col[] = [
    { header: "Tanggal", flex: 1 },
    { header: "Karyawan", flex: 2 },
    { header: "Tipe Shift", flex: 1.2 },
    { header: "Nominal", flex: 1.5, align: "right" },
    { header: "Catatan", flex: 2 },
  ]
  const rows = data.map((r) => [
    fmtTgl(r.tanggal),
    r.karyawan_nama,
    TIPE_SHIFT_LABEL[r.tipe_shift] ?? r.tipe_shift,
    fmtRupiah(r.nominal),
    r.catatan ?? "—",
  ])
  const total = data.reduce((s, r) => s + r.nominal, 0)

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.company}>Mebel Manager</Text>
          <Text style={s.title}>Laporan Absensi</Text>
          <Text style={s.meta}>Periode: {periode}</Text>
        </View>
        <GenericTable cols={cols} rows={rows} />
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>Total Nominal:</Text>
          <Text style={s.summaryValue}>{fmtRupiah(total)}</Text>
        </View>
        <Text style={s.footer}>Dicetak pada {new Date().toLocaleDateString("id-ID")}</Text>
      </Page>
    </Document>
  )
}

// ─── Laporan Penggajian ───────────────────────────────────────────────────────

import type { LaporanPenggajianRow } from "@/lib/actions/laporan"

interface LaporanPenggajianPDFProps {
  data: LaporanPenggajianRow[]
  periode: string
}

export function LaporanPenggajianPDF({ data, periode }: LaporanPenggajianPDFProps) {
  const cols: Col[] = [
    { header: "Periode", flex: 2 },
    { header: "Karyawan", flex: 2 },
    { header: "Total Kalkulasi", flex: 1.5, align: "right" },
    { header: "Total Dibayar", flex: 1.5, align: "right" },
    { header: "Status", flex: 1 },
  ]
  const rows = data.map((r) => [
    `${fmtTgl(r.periode_mulai)} – ${fmtTgl(r.periode_selesai)}`,
    r.karyawan_nama,
    fmtRupiah(r.total_gaji_kalkulasi),
    fmtRupiah(r.total_dibayar),
    r.status === "dibayar" ? "Dibayar" : "Draft",
  ])
  const totalDibayar = data.reduce((s, r) => s + r.total_dibayar, 0)

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.company}>Mebel Manager</Text>
          <Text style={s.title}>Laporan Penggajian</Text>
          <Text style={s.meta}>Periode: {periode}</Text>
        </View>
        <GenericTable cols={cols} rows={rows} />
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>Total Dibayar:</Text>
          <Text style={s.summaryValue}>{fmtRupiah(totalDibayar)}</Text>
        </View>
        <Text style={s.footer}>Dicetak pada {new Date().toLocaleDateString("id-ID")}</Text>
      </Page>
    </Document>
  )
}
