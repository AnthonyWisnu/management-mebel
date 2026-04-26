"use client"

import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { formatRupiah } from "@/lib/utils"
import type { DistribusiSupplier } from "@/lib/actions/dashboard"

interface Props {
  data: DistribusiSupplier[]
}

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#14b8a6", "#ec4899", "#8b5cf6"]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as DistribusiSupplier
  return (
    <div className="bg-background border rounded-lg p-3 shadow-md text-sm">
      <p className="font-medium">{d.nama}</p>
      <p className="text-muted-foreground">{formatRupiah(d.total)}</p>
      <p className="text-muted-foreground">{d.pct}%</p>
    </div>
  )
}

export function DistribusiSupplierPieChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-56 text-muted-foreground text-sm">
        Tidak ada data pembelian
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RePieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="nama"
          cx="50%"
          cy="50%"
          outerRadius={80}
          innerRadius={40}
          paddingAngle={2}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => <span className="text-xs">{value}</span>}
          wrapperStyle={{ fontSize: 11 }}
        />
      </RePieChart>
    </ResponsiveContainer>
  )
}
