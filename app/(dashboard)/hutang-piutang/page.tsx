import { requireAdmin } from "@/lib/actions/auth"
import { getHutangPiutang } from "@/lib/actions/hutang-piutang"
import { HutangPiutangClient } from "./hutang-piutang-client"

export default async function HutangPiutangPage() {
  await requireAdmin()
  const data = await getHutangPiutang({})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hutang & Piutang</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Kelola hutang kepada supplier dan piutang dari pelanggan.
        </p>
      </div>
      <HutangPiutangClient initialData={data} />
    </div>
  )
}
