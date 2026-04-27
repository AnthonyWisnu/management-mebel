import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { requireAuth } from "@/lib/actions/auth"
import { getPelangganOptions } from "@/lib/actions/penjualan"
import { getProduk } from "@/lib/actions/produk"
import { PenjualanForm } from "@/components/forms/PenjualanForm"

export const metadata = { title: "Tambah Penjualan" }

export default async function PenjualanBaruPage() {
  const profile = await requireAuth()
  const isAdmin = profile.role === "admin"

  const [pelangganList, produks] = await Promise.all([
    getPelangganOptions(),
    getProduk(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/penjualan"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          aria-label="Kembali"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Tambah Penjualan</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Catat transaksi penjualan baru ke pelanggan
          </p>
        </div>
      </div>

      <PenjualanForm
        pelangganList={pelangganList}
        produks={produks}
        isAdmin={isAdmin}
      />
    </div>
  )
}
