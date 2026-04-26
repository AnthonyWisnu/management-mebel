import { requireAuth } from "@/lib/actions/auth"
import { getPenjualans, getPelangganOptions } from "@/lib/actions/penjualan"
import { PenjualanPageClient } from "./penjualan-client"

export const metadata = { title: "Transaksi Penjualan" }

export default async function PenjualanPage() {
  const profile = await requireAuth()
  const isAdmin = profile.role === "admin"

  const [penjualans, pelangganList] = await Promise.all([
    getPenjualans(),
    getPelangganOptions(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Transaksi Penjualan</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Kelola transaksi penjualan ke pelanggan
        </p>
      </div>
      <PenjualanPageClient
        initialData={penjualans}
        pelangganList={pelangganList}
        isAdmin={isAdmin}
      />
    </div>
  )
}
