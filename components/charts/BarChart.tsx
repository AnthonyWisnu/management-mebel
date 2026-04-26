"use client"

import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import type { TopProduk } from "@/lib/actions/dashboard"

interface Props {
  data: TopProduk[]
}

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-background border rounded-lg p-3 shadow-md text-sm">
      <p className="font-medium">{payload[0]?.payload?.nama}</p>
      <p className="text-muted-foreground">Qty: {payload[0]?.value}</p>
    </div>
  )
}

export function TopProdukBarChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-56 text-muted-foreground text-sm">
        Tidak ada data produk terjual
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ReBarChart data={data} layout="vertical" margin={{ top: 5, right: 16, left: 8, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
        <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="nama"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={100}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="qty" radius={[0, 4, 4, 0]}>
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </ReBarChart>
    </ResponsiveContainer>
  )
}
