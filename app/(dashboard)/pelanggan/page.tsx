import { requireAuth } from "@/lib/actions/auth"
import { getPelanggan } from "@/lib/actions/pelanggan"
import { PelangganPageClient } from "./pelanggan-client"

export const metadata = { title: "Pelanggan" }

export default async function PelangganPage() {
  const profile = await requireAuth()
  const pelanggan = await getPelanggan()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pelanggan</h1>
        <p className="text-muted-foreground text-sm mt-1">Kelola data pelanggan</p>
      </div>
      <PelangganPageClient initialData={pelanggan} role={profile.role} />
    </div>
  )
}
