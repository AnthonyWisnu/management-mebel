import { requireAdmin } from "@/lib/actions/auth"
import { getUsers, type UserRow } from "@/lib/actions/users"
import { UsersPageClient } from "./users-client"
import { AlertTriangle } from "lucide-react"

export const metadata = { title: "Manajemen User" }

export default async function UsersPage() {
  await requireAdmin()

  let users: UserRow[] = []
  let configError: string | null = null

  try {
    users = await getUsers()
  } catch (err) {
    configError = err instanceof Error ? err.message : "Gagal memuat data user"
    users = []
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Manajemen User</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Kelola akun admin dan pegawai
        </p>
      </div>

      {configError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-5 flex gap-4">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-sm text-destructive">
              Konfigurasi tidak lengkap
            </p>
            <p className="text-sm text-muted-foreground">{configError}</p>
          </div>
        </div>
      ) : (
        <UsersPageClient initialUsers={users} />
      )}
    </div>
  )
}
