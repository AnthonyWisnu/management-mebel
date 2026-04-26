import { Skeleton } from "@/components/ui/skeleton"

export default function LaporanLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-72" />
      </div>
      {/* Tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-md" />
        ))}
      </div>
      {/* Filter card */}
      <div className="border rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-52" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  )
}
