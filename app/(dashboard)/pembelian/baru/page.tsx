import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { requireAdmin } from "@/lib/actions/auth"
import { getSupplierOptions } from "@/lib/actions/pembelian"
import { getProduk } from "@/lib/actions/produk"
import { PembelianForm } from "@/components/forms/PembelianForm"

export const metadata = { title: "Tambah Pembelian" }

export default async function PembelianBaruPage() {
  await requireAdmin()

  const [suppliers, produks] = await Promise.all([
    getSupplierOptions(),
    getProduk(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/pembelian"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          aria-label="Kembali"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Tambah Pembelian</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Catat transaksi pembelian baru dari supplier
          </p>
        </div>
      </div>

      <PembelianForm suppliers={suppliers} produks={produks} />
    </div>
  )
}
