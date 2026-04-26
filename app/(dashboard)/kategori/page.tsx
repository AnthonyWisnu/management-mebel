import { requireAuth } from "@/lib/actions/auth"
import { getKategori } from "@/lib/actions/kategori"
import { KategoriPageClient } from "./kategori-client"

export const metadata = { title: "Kategori Produk" }

export default async function KategoriPage() {
  const profile = await requireAuth()
  const kategori = await getKategori()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Kategori Produk</h1>
        <p className="text-muted-foreground text-sm mt-1">Kelola kategori produk</p>
      </div>
      <KategoriPageClient initialData={kategori} role={profile.role} />
    </div>
  )
}
