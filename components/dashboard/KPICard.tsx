"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatRupiah } from "@/lib/utils"
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface KPICardProps {
  title: string
  value: number
  icon: LucideIcon
  variant?: "default" | "positive" | "negative" | "neutral"
  description?: string
}

export function KPICard({ title, value, icon: Icon, variant = "default", description }: KPICardProps) {
  const isNegative = value < 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div
          className={cn(
            "rounded-md p-2",
            variant === "positive" && "bg-green-100 text-green-600",
            variant === "negative" && "bg-red-100 text-red-600",
            variant === "neutral" && "bg-blue-100 text-blue-600",
            variant === "default" && "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "text-2xl font-bold",
            isNegative && "text-red-600",
            !isNegative && variant === "positive" && "text-green-600"
          )}
        >
          {isNegative && <TrendingDown className="inline h-5 w-5 mr-1" />}
          {!isNegative && variant === "positive" && <TrendingUp className="inline h-5 w-5 mr-1" />}
          {formatRupiah(Math.abs(value))}
          {isNegative && " (rugi)"}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
