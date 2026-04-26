import { requireAuth } from "@/lib/actions/auth"
import { getProduk } from "@/lib/actions/produk"
import { getKategori } from "@/lib/actions/kategori"
import { ProdukPageClient } from "./produk-client"

export const metadata = { title: "Produk" }

export default async function ProdukPage() {
  const profile = await requireAuth()
  const [produk, kategoriList] = await Promise.all([getProduk(), getKategori()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Produk</h1>
        <p className="text-muted-foreground text-sm mt-1">Kelola data produk</p>
      </div>
      <ProdukPageClient initialData={produk} kategoriList={kategoriList} role={profile.role} />
    </div>
  )
}
