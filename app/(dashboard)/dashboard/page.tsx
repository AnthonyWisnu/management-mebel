import { requireAdmin } from "@/lib/actions/auth"
import { getDashboardData } from "@/lib/actions/dashboard"
import { DashboardClient } from "./dashboard-client"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = { title: "Dashboard" }

type PeriodeOption = "hari_ini" | "7_hari" | "bulan_ini" | "bulan_lalu" | "tahun_ini" | "custom"

function getPeriodeRange(
  periode: PeriodeOption,
  dari?: string,
  sampai?: string
): { start: string; end: string } {
  const today = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

  if (periode === "hari_ini") {
    const s = fmt(today)
    return { start: s, end: s }
  }
  if (periode === "7_hari") {
    const dari7 = new Date(today)
    dari7.setDate(today.getDate() - 6)
    return { start: fmt(dari7), end: fmt(today) }
  }
  if (periode === "bulan_ini") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    return { start: fmt(start), end: fmt(end) }
  }
  if (periode === "bulan_lalu") {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const end = new Date(today.getFullYear(), today.getMonth(), 0)
    return { start: fmt(start), end: fmt(end) }
  }
  if (periode === "tahun_ini") {
    return {
      start: `${today.getFullYear()}-01-01`,
      end: `${today.getFullYear()}-12-31`,
    }
  }
  if (periode === "custom" && dari && sampai) {
    return { start: dari, end: sampai }
  }
  // default: bulan ini
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  return { start: fmt(start), end: fmt(end) }
}

interface PageProps {
  searchParams: Promise<{ periode?: string; dari?: string; sampai?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  await requireAdmin()

  const params = await searchParams
  const periode = (params.periode as PeriodeOption) ?? "bulan_ini"
  const dari = params.dari ?? ""
  const sampai = params.sampai ?? ""

  const { start, end } = getPeriodeRange(periode, dari, sampai)
  const data = await getDashboardData(start, end)

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClient
        data={data}
        periodeAktif={periode}
        customDari={dari}
        customSampai={sampai}
      />
    </Suspense>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-56 rounded-lg" />
        <Skeleton className="h-56 rounded-lg" />
      </div>
    </div>
  )
}
