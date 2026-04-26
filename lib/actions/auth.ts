"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { Profile } from "@/types"

export async function getProfile(): Promise<Profile | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    return (data as Profile) ?? null
  } catch {
    return null
  }
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await getProfile()
  if (!profile) redirect("/login")
  if (!profile.aktif) redirect("/login")
  if (profile.role !== "admin") redirect("/penjualan")
  return profile
}

export async function requireAuth(): Promise<Profile> {
  const profile = await getProfile()
  if (!profile) redirect("/login")
  if (!profile.aktif) redirect("/login")
  return profile
}

export async function signIn(
  email: string,
  password: string
): Promise<{ error?: string } | never> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.user) {
    return { error: "Email atau password salah" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, aktif")
    .eq("id", data.user.id)
    .single()

  if (!profile?.aktif) {
    await supabase.auth.signOut()
    return { error: "Akun Anda tidak aktif. Hubungi administrator." }
  }

  redirect(profile.role === "admin" ? "/dashboard" : "/penjualan")
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
