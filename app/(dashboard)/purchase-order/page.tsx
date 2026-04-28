import { requireAuth } from "@/lib/actions/auth"
import { getPurchaseOrders, getPelangganOptions } from "@/lib/actions/purchase-order"
import { POPageClient } from "./po-client"

export const metadata = { title: "Purchase Order" }

export default async function PurchaseOrderPage() {
  await requireAuth()

  const [orders, pelangganList] = await Promise.all([
    getPurchaseOrders(),
    getPelangganOptions(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Purchase Order</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Kelola pesanan masuk dan pantau deadline pengerjaan
        </p>
      </div>
      <POPageClient initialData={orders} pelangganList={pelangganList} />
    </div>
  )
}
