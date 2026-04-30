import { requireAuth } from "@/lib/actions/auth"
import { getPembelians, getSupplierOptions } from "@/lib/actions/pembelian"
import { PembelianPageClient } from "./pembelian-client"

export const metadata = { title: "Transaksi Pembelian" }

export default async function PembelianPage() {
  const profile = await requireAuth()

  const [pembelians, suppliers] = await Promise.all([
    getPembelians(),
    getSupplierOptions(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Transaksi Pembelian</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Kelola transaksi pembelian dari supplier
        </p>
      </div>
      <PembelianPageClient
        initialData={pembelians}
        suppliers={suppliers}
        isAdmin={profile.role === "admin"}
      />
    </div>
  )
}
