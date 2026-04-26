import { requireAuth } from "@/lib/actions/auth"
import { getKaryawan } from "@/lib/actions/karyawan"
import { KaryawanPageClient } from "./karyawan-client"
import type { Role } from "@/types"

export const metadata = { title: "Karyawan" }

export default async function KaryawanPage() {
  const profile = await requireAuth()
  const karyawan = await getKaryawan()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Karyawan</h1>
        <p className="text-muted-foreground text-sm mt-1">Kelola data karyawan</p>
      </div>
      <KaryawanPageClient initialData={karyawan} role={profile.role as Role} />
    </div>
  )
}
