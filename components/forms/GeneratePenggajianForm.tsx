"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { generatePenggajianSchema, type GeneratePenggajianInput } from "@/lib/validations/penggajian"
import { generatePenggajian } from "@/lib/actions/penggajian"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

interface GeneratePenggajianFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

function getLastWeekRange(): { start: string; end: string } {
  const today = new Date()
  const day = today.getDay() // 0=Sun, 1=Mon ...
  const daysToThisMonday = day === 0 ? 6 : day - 1
  const thisMonday = new Date(today)
  thisMonday.setDate(today.getDate() - daysToThisMonday)
  const lastMonday = new Date(thisMonday)
  lastMonday.setDate(thisMonday.getDate() - 7)
  const lastSunday = new Date(lastMonday)
  lastSunday.setDate(lastMonday.getDate() + 6)
  return {
    start: lastMonday.toISOString().split("T")[0],
    end: lastSunday.toISOString().split("T")[0],
  }
}

export function GeneratePenggajianForm({
  open,
  onOpenChange,
  onSuccess,
}: GeneratePenggajianFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [resultMsg, setResultMsg] = useState<string | null>(null)

  const defaults = getLastWeekRange()

  const form = useForm<GeneratePenggajianInput>({
    resolver: zodResolver(generatePenggajianSchema),
    defaultValues: {
      periode_mulai: defaults.start,
      periode_selesai: defaults.end,
    },
  })

  const { formState: { isSubmitting } } = form

  useEffect(() => {
    if (open) {
      const r = getLastWeekRange()
      form.reset({ periode_mulai: r.start, periode_selesai: r.end })
      setServerError(null)
      setResultMsg(null)
    }
  }, [open, form])

  const onSubmit = async (data: GeneratePenggajianInput) => {
    setServerError(null)
    setResultMsg(null)
    const result = await generatePenggajian(data)

    if (result.error) {
      setServerError(result.error)
      return
    }

    const msg =
      result.skipped && result.skipped > 0
        ? `${result.count} slip gaji dibuat, ${result.skipped} karyawan dilewati (sudah ada)`
        : `${result.count} slip gaji berhasil dibuat`

    toast.success(msg)
    onOpenChange(false)
    onSuccess?.()
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Generate Penggajian"
      className="sm:max-w-md"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Sistem akan menghitung total gaji dari data absensi setiap karyawan
            dalam periode yang dipilih, lalu membuat slip gaji draft secara otomatis.
          </p>

          {serverError && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {serverError}
            </div>
          )}
          {resultMsg && (
            <div className="text-sm text-green-700 bg-green-50 rounded-md px-3 py-2">
              {resultMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="periode_mulai"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Dari <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="date" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="periode_selesai"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Sampai <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="date" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Memproses..." : "Generate"}
            </Button>
          </div>
        </form>
      </Form>
    </ResponsiveModal>
  )
}
