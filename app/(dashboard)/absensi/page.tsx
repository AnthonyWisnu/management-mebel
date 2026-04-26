import { requireAuth } from "@/lib/actions/auth"
import { getAbsensis } from "@/lib/actions/absensi"
import { getKaryawan } from "@/lib/actions/karyawan"
import { AbsensiPageClient } from "./absensi-client"

export const metadata = { title: "Absensi Karyawan" }

export default async function AbsensiPage() {
  const profile = await requireAuth()
  const isAdmin = profile.role === "admin"

  const [absensis, karyawanList] = await Promise.all([
    getAbsensis(),
    getKaryawan(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Absensi Karyawan</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Kelola catatan kehadiran dan shift karyawan
        </p>
      </div>
      <AbsensiPageClient
        initialData={absensis}
        karyawanList={karyawanList}
        isAdmin={isAdmin}
      />
    </div>
  )
}
