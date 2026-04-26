import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { requireAuth } from "@/lib/actions/auth"
import { getPenggajianById } from "@/lib/actions/penggajian"
import { PenggajianDetailClient } from "./penggajian-detail-client"
import { formatTanggal } from "@/lib/utils"

export const metadata = { title: "Detail Slip Gaji" }

interface DetailPageProps {
  params: Promise<{ id: string }>
}

export default async function PenggajianDetailPage({ params }: DetailPageProps) {
  const profile = await requireAuth()
  const isAdmin = profile.role === "admin"

  const { id } = await params
  const penggajian = await getPenggajianById(id)
  if (!penggajian) notFound()

  const subtitle = `${penggajian.karyawan?.nama ?? "-"} · ${formatTanggal(penggajian.periode_mulai)} – ${formatTanggal(penggajian.periode_selesai)}`

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/penggajian"
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
          aria-label="Kembali"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Slip Gaji</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{subtitle}</p>
        </div>
      </div>

      <PenggajianDetailClient penggajian={penggajian} isAdmin={isAdmin} />
    </div>
  )
}
