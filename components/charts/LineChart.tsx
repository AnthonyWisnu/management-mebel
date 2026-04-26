"use client"

import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { formatRupiah } from "@/lib/utils"
import type { TrendPoint } from "@/lib/actions/dashboard"

interface Props {
  data: TrendPoint[]
}

function formatTgl(tanggal: string) {
  const d = new Date(tanggal)
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-background border rounded-lg p-3 shadow-md text-sm">
      <p className="font-medium mb-2">{formatTgl(label)}</p>
      {payload.map((entry: any, i: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {formatRupiah(entry.value)}
        </p>
      ))}
    </div>
  )
}

export function TrendLineChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-56 text-muted-foreground text-sm">
        Tidak ada data dalam periode ini
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ReLineChart data={data} margin={{ top: 5, right: 16, left: 8, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="tanggal"
          tickFormatter={formatTgl}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}jt`}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => (value === "penjualan" ? "Penjualan" : "Pembelian")}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Line
          type="monotone"
          dataKey="penjualan"
          stroke="#22c55e"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="pembelian"
          stroke="#ef4444"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </ReLineChart>
    </ResponsiveContainer>
  )
}
