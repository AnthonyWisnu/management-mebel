import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { requireAdmin } from "@/lib/actions/auth"
import { getPembelianById, getSupplierOptions } from "@/lib/actions/pembelian"
import { getProduk } from "@/lib/actions/produk"
import { PembelianForm } from "@/components/forms/PembelianForm"

export const metadata = { title: "Edit Pembelian" }

interface EditPembelianPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPembelianPage({ params }: EditPembelianPageProps) {
  await requireAdmin()

  const { id } = await params

  const [pembelian, suppliers, produks] = await Promise.all([
    getPembelianById(id),
    getSupplierOptions(),
    getProduk(),
  ])

  if (!pembelian) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/pembelian"
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
          aria-label="Kembali"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Edit Pembelian</h1>
          <p className="text-muted-foreground text-sm mt-0.5 font-mono">
            {pembelian.no_faktur ?? "—"}
          </p>
        </div>
      </div>

      <PembelianForm suppliers={suppliers} produks={produks} pembelian={pembelian} />
    </div>
  )
}
