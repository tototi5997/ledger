"use server"

import { getAuthRedirectUrl } from "@/lib/auth/redirect-url"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { forgotPasswordSchema, normalizeEmail } from "@/lib/validations/auth"

export type ForgotPasswordActionState = {
  message: string
  status?: "idle" | "success"
}

const initialErrorMessage = "请求失败，请稍后重试"

export async function forgotPasswordAction(
  _previousState: ForgotPasswordActionState,
  formData: FormData
): Promise<ForgotPasswordActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  })

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? initialErrorMessage }
  }

  const supabase = await createSupabaseServerClient()
  const email = normalizeEmail(parsed.data.email)
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getAuthRedirectUrl("/auth/confirm?next=/reset-password"),
  })

  if (error) {
    return { message: getResetEmailErrorMessage(error.message) }
  }

  return {
    status: "success",
    message: "如果该邮箱已注册，我们会发送一封密码重设邮件。",
  }
}

function getResetEmailErrorMessage(message?: string) {
  if (message?.toLowerCase().includes("rate limit")) {
    return "发送过于频繁，请稍后再试"
  }

  return "密码重设邮件发送失败，请稍后重试"
}
