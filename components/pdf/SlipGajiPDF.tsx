import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import type { Penggajian, Absensi, TipeShift } from "@/types"

const TIPE_SHIFT_LABEL: Record<TipeShift, string> = {
  setengah_hari: "1/2 Hari",
  satu_hari: "1 Hari",
  lembur: "Lembur",
}

import { formatRupiah, formatTanggal } from "@/lib/utils"

function fmtPeriode(mulai: string, selesai: string) {
  return `${formatTanggal(mulai)} – ${formatTanggal(selesai)}`
}

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, padding: 36, color: "#1a1a1a" },
  header: { marginBottom: 20, borderBottom: "1.5 solid #e5e7eb", paddingBottom: 12 },
  company: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  subtitle: { fontSize: 10, color: "#6b7280" },
  title: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 6 },
  infoGrid: { flexDirection: "row", gap: 24, marginBottom: 16 },
  infoBlock: { flex: 1 },
  infoLabel: { color: "#6b7280", marginBottom: 2 },
  infoValue: { fontFamily: "Helvetica-Bold" },
  table: { marginTop: 8 },
  tableHead: { flexDirection: "row", backgroundColor: "#f3f4f6", borderRadius: 3, padding: "5 8" },
  tableRow: { flexDirection: "row", padding: "5 8", borderBottom: "0.5 solid #e5e7eb" },
  colDate: { width: "30%" },
  colShift: { width: "25%" },
  colNominal: { width: "45%", textAlign: "right" },
  thLabel: { fontFamily: "Helvetica-Bold" },
  totalSection: { marginTop: 16, borderTop: "1 solid #e5e7eb", paddingTop: 10 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  totalLabel: { color: "#6b7280" },
  totalValue: { fontFamily: "Helvetica-Bold" },
  totalDibayarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    padding: "6 8",
    backgroundColor: "#f0fdf4",
    borderRadius: 3,
  },
  totalDibayarLabel: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  totalDibayarValue: { fontFamily: "Helvetica-Bold", fontSize: 11, color: "#15803d" },
  signSection: { flexDirection: "row", marginTop: 40, gap: 40 },
  signBox: { flex: 1, alignItems: "center" },
  signLabel: { color: "#6b7280", marginBottom: 48 },
  signLine: { borderTop: "1 solid #1a1a1a", width: "80%", textAlign: "center", paddingTop: 4 },
  footer: { marginTop: 24, borderTop: "0.5 solid #e5e7eb", paddingTop: 8, color: "#9ca3af", fontSize: 8 },
})

interface SlipGajiPDFProps {
  penggajian: Penggajian
}

export function SlipGajiPDF({ penggajian }: SlipGajiPDFProps) {
  const absensiList: Absensi[] = penggajian.absensi ?? []
  const karyawan = penggajian.karyawan

  return (
    <Document title={`Slip Gaji - ${karyawan?.nama ?? ""}`}>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.company}>ADIFA Furniture</Text>
          <Text style={s.subtitle}>Slip Gaji Karyawan</Text>
          <Text style={s.title}>
            Periode: {fmtPeriode(penggajian.periode_mulai, penggajian.periode_selesai)}
          </Text>
        </View>

        {/* Info Karyawan */}
        <View style={s.infoGrid}>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Nama Karyawan</Text>
            <Text style={s.infoValue}>{karyawan?.nama ?? "-"}</Text>
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Jabatan</Text>
            <Text style={s.infoValue}>{karyawan?.jabatan ?? "-"}</Text>
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Status</Text>
            <Text style={s.infoValue}>
              {penggajian.status === "dibayar" ? "Sudah Dibayar" : "Draft"}
            </Text>
          </View>
          {penggajian.tanggal_bayar && (
            <View style={s.infoBlock}>
              <Text style={s.infoLabel}>Tanggal Bayar</Text>
              <Text style={s.infoValue}>{formatTanggal(penggajian.tanggal_bayar)}</Text>
            </View>
          )}
        </View>

        {/* Tabel Absensi */}
        {absensiList.length > 0 && (
          <View style={s.table}>
            <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 6 }}>
              Rincian Kehadiran
            </Text>
            <View style={s.tableHead}>
              <Text style={[s.colDate, s.thLabel]}>Tanggal</Text>
              <Text style={[s.colShift, s.thLabel]}>Tipe Shift</Text>
              <Text style={[s.colNominal, s.thLabel]}>Nominal</Text>
            </View>
            {absensiList.map((a) => (
              <View key={a.id} style={s.tableRow}>
                <Text style={s.colDate}>{formatTanggal(a.tanggal)}</Text>
                <Text style={s.colShift}>{TIPE_SHIFT_LABEL[a.tipe_shift]}</Text>
                <Text style={s.colNominal}>{formatRupiah(a.nominal)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Total */}
        <View style={s.totalSection}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total Gaji Kalkulasi</Text>
            <Text style={s.totalValue}>{formatRupiah(penggajian.total_gaji_kalkulasi)}</Text>
          </View>
          <View style={s.totalDibayarRow}>
            <Text style={s.totalDibayarLabel}>Total Dibayar</Text>
            <Text style={s.totalDibayarValue}>{formatRupiah(penggajian.total_dibayar)}</Text>
          </View>
          {penggajian.catatan && (
            <View style={{ marginTop: 10 }}>
              <Text style={s.totalLabel}>Catatan</Text>
              <Text style={{ marginTop: 2 }}>{penggajian.catatan}</Text>
            </View>
          )}
        </View>

        {/* Tanda Tangan */}
        <View style={s.signSection}>
          <View style={s.signBox}>
            <Text style={s.signLabel}>Penerima</Text>
            <View style={s.signLine}>
              <Text>{karyawan?.nama ?? "........................"}</Text>
            </View>
          </View>
          <View style={s.signBox}>
            <Text style={s.signLabel}>Mengetahui</Text>
            <View style={s.signLine}>
              <Text>Pimpinan</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text>
            Dicetak pada {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
