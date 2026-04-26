import { requireAuth } from "@/lib/actions/auth"
import { getSuppliers } from "@/lib/actions/supplier"
import { SupplierPageClient } from "./supplier-client"

export const metadata = { title: "Supplier" }

export default async function SupplierPage() {
  const profile = await requireAuth()
  const suppliers = await getSuppliers()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Supplier</h1>
        <p className="text-muted-foreground text-sm mt-1">Kelola data supplier</p>
      </div>
      <SupplierPageClient initialData={suppliers} role={profile.role} />
    </div>
  )
}
