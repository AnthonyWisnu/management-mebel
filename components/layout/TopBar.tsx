"use client"

import { useRouter } from "next/navigation"
import { Menu, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { buttonVariants } from "@/components/ui/button"
import { signOut } from "@/lib/actions/auth"
import { cn } from "@/lib/utils"
import type { Role } from "@/types"

interface TopBarProps {
  nama: string
  role: Role
  onMobileMenuToggle: () => void
}

export function TopBar({ nama, role, onMobileMenuToggle }: TopBarProps) {
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push("/login")
  }

  return (
    <header className="h-16 border-b bg-card flex items-center gap-3 px-4 shrink-0">
      {/* Hamburger — hanya di mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMobileMenuToggle}
        aria-label="Buka menu navigasi"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1" />

      {/* User info + dropdown */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex flex-col items-end leading-tight">
          <span className="text-sm font-medium">{nama}</span>
          <Badge
            variant={role === "admin" ? "default" : "secondary"}
            className="text-xs px-1.5 py-0 h-4"
          >
            {role}
          </Badge>
        </div>

        <DropdownMenu>
          {/* base-ui Trigger renders as <button> — pakai className langsung */}
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "rounded-full"
            )}
            aria-label="Menu akun"
          >
            <User className="h-5 w-5" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="min-w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium leading-none">{nama}</p>
              <p className="text-xs leading-none text-muted-foreground capitalize mt-1">
                {role}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
