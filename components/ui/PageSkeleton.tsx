import { Skeleton } from "@/components/ui/skeleton"

interface PageSkeletonProps {
  hasButton?: boolean
  hasFilter?: boolean
  rows?: number
  cols?: number
  variant?: "table" | "cards" | "detail" | "form"
}

export function PageSkeleton({
  hasButton = true,
  hasFilter = false,
  rows = 7,
  cols = 4,
  variant = "table",
}: PageSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-60" />
        </div>
        {hasButton && <Skeleton className="h-9 w-32" />}
      </div>

      {variant === "table" && (
        <>
          {/* Filter / search bar */}
          {hasFilter ? (
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-9 w-36" />
              <Skeleton className="h-9 w-36" />
              <Skeleton className="h-9 w-28" />
            </div>
          ) : (
            <Skeleton className="h-9 w-64" />
          )}

          {/* Desktop table skeleton */}
          <div className="hidden md:block border rounded-lg overflow-hidden">
            <div className="bg-muted/50 px-4 py-3 flex gap-6">
              {Array.from({ length: cols }).map((_, i) => (
                <Skeleton key={i} className="h-4 flex-1" />
              ))}
            </div>
            {Array.from({ length: rows }).map((_, i) => (
              <div
                key={i}
                className="px-4 py-3 flex gap-6 border-t"
                style={{ opacity: 1 - i * 0.09 }}
              >
                {Array.from({ length: cols }).map((_, j) => (
                  <Skeleton
                    key={j}
                    className="h-4"
                    style={{ flex: j === 0 ? 1.4 : 1 }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Mobile card skeleton */}
          <div className="md:hidden space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-36" />
              </div>
            ))}
          </div>
        </>
      )}

      {variant === "cards" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
      )}

      {variant === "detail" && (
        <div className="space-y-4">
          <div className="border rounded-lg p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-4 w-32 shrink-0" />
                <Skeleton className="h-4 flex-1 max-w-xs" />
              </div>
            ))}
          </div>
          <div className="border rounded-lg overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-4 py-3 flex gap-4 border-t first:border-0">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 flex-1" />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {variant === "form" && (
        <div className="max-w-2xl space-y-6 border rounded-lg p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      )}
    </div>
  )
}
