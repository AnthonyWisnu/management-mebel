import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { requireAdmin } from "@/lib/actions/auth"
import { getPurchaseOrderById, getPelangganOptions } from "@/lib/actions/purchase-order"
import { PurchaseOrderForm } from "@/components/forms/PurchaseOrderForm"

export const metadata = { title: "Edit Purchase Order" }

export default async function POEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params

  const [po, pelangganList] = await Promise.all([
    getPurchaseOrderById(id),
    getPelangganOptions(),
  ])

  if (!po) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/purchase-order"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          aria-label="Kembali"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Edit Purchase Order</h1>
          <p className="text-muted-foreground text-sm mt-0.5 font-mono">
            {po.no_po}
          </p>
        </div>
      </div>

      <PurchaseOrderForm pelangganList={pelangganList} po={po} />
    </div>
  )
}
