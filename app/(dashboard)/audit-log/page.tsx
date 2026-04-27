import { requireAdmin } from "@/lib/actions/auth"
import { getAuditLog, type AuditLogRow } from "@/lib/actions/audit-log"
import { AlertTriangle } from "lucide-react"
import { AuditLogClient } from "./audit-log-client"

export const metadata = { title: "Riwayat Aktivitas" }

export default async function AuditLogPage() {
  await requireAdmin()

  let rows: AuditLogRow[] = []
  let configError: string | null = null

  try {
    rows = await getAuditLog(200)
  } catch (err) {
    configError = err instanceof Error ? err.message : "Gagal memuat data"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Riwayat Aktivitas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Log perubahan transaksi penjualan, pembelian, dan penggajian
        </p>
      </div>

      {configError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-5 flex gap-4">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-sm text-destructive">Gagal memuat data</p>
            <p className="text-sm text-muted-foreground">{configError}</p>
          </div>
        </div>
      ) : (
        <AuditLogClient rows={rows} />
      )}
    </div>
  )
}
