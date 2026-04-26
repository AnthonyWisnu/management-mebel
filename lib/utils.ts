import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(value: number): string {
  if (isNaN(value)) return "Rp 0"
  return (
    "Rp " +
    Math.round(value)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  )
}

export function formatTanggal(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function generateNoFaktur(prefix: string): string {
  const now = new Date()
  const yyyymmdd =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0")
  const random = Math.floor(Math.random() * 900 + 100).toString()
  return `${prefix}-${yyyymmdd}-${random}`
}

export function parseRupiah(value: string): number {
  return parseInt(value.replace(/[^0-9]/g, ""), 10) || 0
}
