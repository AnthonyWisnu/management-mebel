"use server"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/actions/auth"
import { createClient } from "@/lib/supabase/server"
import type { CreateUserInput, UpdateUserInput } from "@/lib/validations/user"
import type { Profile, Role } from "@/types"

export interface UserRow {
  id: string
  email: string
  nama: string | null
  role: Role
  aktif: boolean
  created_at: string
}

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function getUsers(): Promise<UserRow[]> {
  await requireAdmin()

  const adminClient = getAdminClient()
  const supabase = await createClient()

  const [{ data: authData }, { data: profiles }] = await Promise.all([
    adminClient.auth.admin.listUsers({ perPage: 1000 }),
    supabase.from("profiles").select("id, nama, role, aktif, created_at"),
  ])

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p as Profile])
  )

  return (authData?.users ?? [])
    .filter((u) => profileMap.has(u.id))
    .map((u) => {
      const p = profileMap.get(u.id)!
      return {
        id: u.id,
        email: u.email ?? "",
        nama: p.nama,
        role: p.role,
        aktif: p.aktif,
        created_at: p.created_at,
      }
    })
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
}

export async function createUser(
  data: CreateUserInput
): Promise<{ error?: string }> {
  await requireAdmin()

  const adminClient = getAdminClient()

  const { data: authUser, error } = await adminClient.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { nama: data.nama },
  })

  if (error || !authUser?.user) {
    if (error?.message?.includes("already registered")) {
      return { error: "Email sudah terdaftar" }
    }
    return { error: error?.message ?? "Gagal membuat user" }
  }

  // Trigger handle_new_user sudah insert profiles — update role & nama
  await adminClient
    .from("profiles")
    .update({ role: data.role, nama: data.nama })
    .eq("id", authUser.user.id)

  revalidatePath("/users")
  return {}
}

export async function updateUser(
  id: string,
  data: UpdateUserInput
): Promise<{ error?: string }> {
  await requireAdmin()

  const adminClient = getAdminClient()

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({ nama: data.nama, role: data.role })
    .eq("id", id)

  if (profileError) return { error: profileError.message }

  if (data.password) {
    const { error: pwError } = await adminClient.auth.admin.updateUserById(
      id,
      { password: data.password }
    )
    if (pwError) return { error: pwError.message }
  }

  revalidatePath("/users")
  return {}
}

export async function toggleUserActive(id: string): Promise<{ error?: string }> {
  await requireAdmin()

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("aktif")
    .eq("id", id)
    .single()

  const { error } = await supabase
    .from("profiles")
    .update({ aktif: !profile?.aktif })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/users")
  return {}
}
