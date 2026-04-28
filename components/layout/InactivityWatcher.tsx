"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const TIMEOUT_MS = 8 * 60 * 1000  // 8 menit tidak aktif → logout
const WARNING_MS = 60 * 1000       // peringatan muncul 1 menit sebelum logout

const ACTIVITY_EVENTS = [
  "mousemove", "mousedown", "keydown", "touchstart", "scroll", "click",
] as const

export function InactivityWatcher() {
  const router = useRouter()
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(60)

  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const warningShownRef = useRef(false)
  const routerRef = useRef(router)
  routerRef.current = router

  // Exposed to JSX buttons via ref to avoid stale closure issues
  const actionsRef = useRef({
    resetTimers: () => {},
    doLogout: async () => {},
  })

  useEffect(() => {
    function clearAll() {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current)
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }

    async function doLogout() {
      clearAll()
      const supabase = createClient()
      await supabase.auth.signOut()
      routerRef.current.push("/login")
    }

    function resetTimers() {
      clearAll()
      warningShownRef.current = false
      setShowWarning(false)

      warningTimerRef.current = setTimeout(() => {
        warningShownRef.current = true
        setShowWarning(true)
        setCountdown(Math.floor(WARNING_MS / 1000))

        countdownIntervalRef.current = setInterval(() => {
          setCountdown((c) => Math.max(0, c - 1))
        }, 1000)
      }, TIMEOUT_MS - WARNING_MS)

      logoutTimerRef.current = setTimeout(doLogout, TIMEOUT_MS)
    }

    function handleActivity() {
      // Saat warning sudah muncul, jangan reset — user harus pilih tombol
      if (!warningShownRef.current) resetTimers()
    }

    actionsRef.current = { resetTimers, doLogout }

    resetTimers()
    ACTIVITY_EVENTS.forEach((e) =>
      window.addEventListener(e, handleActivity, { passive: true })
    )

    return () => {
      clearAll()
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, handleActivity))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog open={showWarning} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Sesi Hampir Habis</DialogTitle>
          <DialogDescription>
            Anda tidak aktif cukup lama. Anda akan otomatis keluar dalam{" "}
            <span className="font-semibold text-foreground">{countdown}</span> detik.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => actionsRef.current.doLogout()}
          >
            Keluar Sekarang
          </Button>
          <Button onClick={() => actionsRef.current.resetTimers()}>
            Tetap Login
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
