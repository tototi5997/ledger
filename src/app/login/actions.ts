"use server"

import { redirect } from "next/navigation"

import { ensureUserWorkspace } from "@/lib/ledger/initialize"
import { getAuthRedirectUrl } from "@/lib/auth/redirect-url"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { loginSchema, normalizeEmail, registerSchema } from "@/lib/validations/auth"

export type AuthActionState = {
  message: string
  status?: "idle" | "success"
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
  const email = normalizeEmail(parsed.data.email)
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  })

  if (error || !data.user) {
    return { message: getLoginErrorMessage(error?.message) }
  }

  await ensureUserWorkspace(supabase, {
    id: data.user.id,
    email: data.user.email ?? email,
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
  const email = normalizeEmail(parsed.data.email)
  const { error } = await supabase.auth.signUp({
    email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: getAuthRedirectUrl("/auth/confirm?next=/"),
    },
  })

  if (error) {
    return { message: error?.message ?? "注册失败，请稍后重试" }
  }

  await supabase.auth.signOut()

  return {
    status: "success",
    message: `验证邮件已发送到 ${email}，请打开邮件中的链接完成注册。`,
  }
}

export async function signOutAction(): Promise<AuthActionState> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    return { message: error.message || "退出失败，请稍后重试" }
  }

  redirect("/login")
}

function getLoginErrorMessage(message?: string) {
  if (message?.toLowerCase().includes("email not confirmed")) {
    return "请先打开验证邮件完成邮箱确认"
  }

  return "邮箱或密码错误"
}
