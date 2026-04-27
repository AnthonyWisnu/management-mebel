import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { requireAuth } from "@/lib/actions/auth"
import { getPenjualanById, getPelangganOptions } from "@/lib/actions/penjualan"
import { getProduk } from "@/lib/actions/produk"
import { PenjualanForm } from "@/components/forms/PenjualanForm"

export const metadata = { title: "Edit Penjualan" }

interface EditPenjualanPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPenjualanPage({ params }: EditPenjualanPageProps) {
  const profile = await requireAuth()
  const isAdmin = profile.role === "admin"

  const { id } = await params

  const [penjualan, pelangganList, produks] = await Promise.all([
    getPenjualanById(id),
    getPelangganOptions(),
    getProduk(),
  ])

  if (!penjualan) notFound()

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
          <h1 className="text-2xl font-semibold">Edit Penjualan</h1>
          <p className="text-muted-foreground text-sm mt-0.5 font-mono">
            {penjualan.no_faktur ?? "—"}
          </p>
        </div>
      </div>

      <PenjualanForm
        pelangganList={pelangganList}
        produks={produks}
        isAdmin={isAdmin}
        penjualan={penjualan}
      />
    </div>
  )
}
