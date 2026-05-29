"use server"

import { redirect } from "next/navigation"
import { cookies } from "next/headers"

import {
  passwordRecoveryCookieName,
  passwordRecoveryCookieOptions,
} from "@/lib/auth/recovery"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { resetPasswordSchema } from "@/lib/validations/auth"

export type ResetPasswordActionState = {
  message: string
  status?: "idle" | "success"
}

const initialErrorMessage = "请求失败，请稍后重试"

export async function resetPasswordAction(
  _previousState: ResetPasswordActionState,
  formData: FormData
): Promise<ResetPasswordActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? initialErrorMessage }
  }

  const cookieStore = await cookies()
  const hasRecoveryTicket = cookieStore.get(passwordRecoveryCookieName)?.value === "1"

  if (!hasRecoveryTicket) {
    return { message: "密码重设链接无效或已过期，请重新发送重设邮件" }
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { message: "密码重设链接无效或已过期，请重新发送重设邮件" }
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (error) {
    return { message: getUpdatePasswordErrorMessage(error.message) }
  }

  await supabase.auth.signOut()
  cookieStore.set(passwordRecoveryCookieName, "", {
    ...passwordRecoveryCookieOptions,
    maxAge: 0,
  })
  redirect("/login?reset=1")
}

function getUpdatePasswordErrorMessage(message?: string) {
  const lowerMessage = message?.toLowerCase() ?? ""

  if (lowerMessage.includes("same password")) {
    return "新密码不能与当前密码相同"
  }

  if (lowerMessage.includes("session")) {
    return "密码重设链接无效或已过期，请重新发送重设邮件"
  }

  return "密码更新失败，请稍后重试"
}
