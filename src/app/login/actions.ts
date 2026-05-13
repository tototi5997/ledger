"use server"

import { redirect } from "next/navigation"

import { ensureUserWorkspace } from "@/lib/ledger/initialize"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { loginSchema, normalizeEmail, registerSchema } from "@/lib/validations/auth"

export type AuthActionState = {
  message: string
}

const initialErrorMessage = "请求失败，请稍后重试"

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? initialErrorMessage }
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizeEmail(parsed.data.email),
    password: parsed.data.password,
  })

  if (error || !data.user) {
    return { message: "邮箱或密码错误" }
  }

  await ensureUserWorkspace(supabase, {
    id: data.user.id,
    email: data.user.email ?? normalizeEmail(parsed.data.email),
  })

  redirect("/")
}

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? initialErrorMessage }
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signUp({
    email: normalizeEmail(parsed.data.email),
    password: parsed.data.password,
  })

  if (error || !data.user) {
    return { message: error?.message ?? "注册失败，请稍后重试" }
  }

  await ensureUserWorkspace(supabase, {
    id: data.user.id,
    email: data.user.email ?? normalizeEmail(parsed.data.email),
  })

  redirect("/")
}

export async function signOutAction(): Promise<AuthActionState> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    return { message: error.message || "退出失败，请稍后重试" }
  }

  redirect("/login")
}
