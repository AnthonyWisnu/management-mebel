import { PageSkeleton } from "@/components/ui/PageSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      {/* Filter bar */}
      <div className="border rounded-lg p-4">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-md" />
          ))}
        </div>
      </div>
      {/* KPI cards */}
      <PageSkeleton variant="cards" hasButton={false} />
      {/* Line chart */}
      <Skeleton className="h-80 rounded-lg" />
      {/* Bar + Pie charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
      {/* Recent tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-52 rounded-lg" />
        <Skeleton className="h-52 rounded-lg" />
      </div>
    </div>
  )
}
