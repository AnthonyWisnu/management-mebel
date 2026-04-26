"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-lg font-semibold mb-1">Terjadi Kesalahan</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        Halaman ini tidak dapat dimuat. Coba muat ulang atau kembali ke halaman sebelumnya.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Coba Lagi</Button>
        <Button variant="outline" onClick={() => window.history.back()}>
          Kembali
        </Button>
      </div>
    </div>
  )
}
