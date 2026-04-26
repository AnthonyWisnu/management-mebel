import { requireAuth } from "@/lib/actions/auth"
import { getPenggajians } from "@/lib/actions/penggajian"
import { getKaryawan } from "@/lib/actions/karyawan"
import { PenggajianPageClient } from "./penggajian-client"

export const metadata = { title: "Penggajian" }

export default async function PenggajianPage() {
  const profile = await requireAuth()
  const isAdmin = profile.role === "admin"

  const [penggajians, karyawanList] = await Promise.all([
    getPenggajians(),
    getKaryawan(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Penggajian</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Kelola slip gaji dan pembayaran karyawan
        </p>
      </div>
      <PenggajianPageClient
        initialData={penggajians}
        karyawanList={karyawanList}
        isAdmin={isAdmin}
      />
    </div>
  )
}
