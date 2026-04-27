"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Truck,
  Users,
  Tag,
  Package,
  UserCheck,
  ShoppingCart,
  ShoppingBag,
  CalendarCheck,
  Wallet,
  FileBarChart,
  UserCog,
} from "lucide-react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import type { Role } from "@/types"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  adminOnly?: boolean
}

interface NavSection {
  label: string | null
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: null,
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        adminOnly: true,
      },
    ],
  },
  {
    label: "Master Data",
    items: [
      { href: "/supplier", label: "Supplier", icon: Truck },
      { href: "/pelanggan", label: "Pelanggan", icon: Users },
      { href: "/kategori", label: "Kategori Produk", icon: Tag },
      { href: "/produk", label: "Produk", icon: Package },
      { href: "/karyawan", label: "Karyawan", icon: UserCheck },
    ],
  },
  {
    label: "Transaksi",
    items: [
      {
        href: "/pembelian",
        label: "Pembelian",
        icon: ShoppingCart,
        adminOnly: true,
      },
      { href: "/penjualan", label: "Penjualan", icon: ShoppingBag },
    ],
  },
  {
    label: "HR & Penggajian",
    items: [
      { href: "/absensi", label: "Absensi", icon: CalendarCheck },
      { href: "/penggajian", label: "Penggajian", icon: Wallet },
    ],
  },
  {
    label: "Laporan",
    items: [{ href: "/laporan", label: "Laporan", icon: FileBarChart }],
  },
  {
    label: "Pengaturan",
    items: [
      {
        href: "/users",
        label: "Manajemen User",
        icon: UserCog,
        adminOnly: true,
      },
    ],
  },
]

function BrandLogo() {
  return (
    <div className="h-16 flex items-center px-6 border-b shrink-0">
      <span className="font-semibold text-base tracking-tight">
        ADIFA Furniture
      </span>
    </div>
  )
}

function NavContent({
  role,
  onItemClick,
}: {
  role: Role
  onItemClick?: () => void
}) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 p-3">
      {NAV_SECTIONS.map((section) => {
        const visible = section.items.filter(
          (item) => !item.adminOnly || role === "admin"
        )
        if (visible.length === 0) return null

        return (
          <div key={section.label ?? "__main"} className="mb-2">
            {section.label && (
              <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.label}
              </p>
            )}
            {visible.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href + "/"))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onItemClick}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/70 hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        )
      })}
    </nav>
  )
}

interface SidebarProps {
  role: Role
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ role, mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Desktop — selalu terlihat */}
      <aside className="hidden md:flex md:flex-col w-60 border-r bg-card shrink-0">
        <BrandLogo />
        <div className="flex-1 overflow-y-auto">
          <NavContent role={role} />
        </div>
      </aside>

      {/* Mobile — Sheet dari kiri */}
      <Sheet open={mobileOpen} onOpenChange={onMobileClose}>
        <SheetContent side="left" className="w-60 p-0 flex flex-col">
          <BrandLogo />
          <div className="flex-1 overflow-y-auto">
            <NavContent role={role} onItemClick={onMobileClose} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
