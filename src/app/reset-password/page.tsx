import { redirect } from "next/navigation"
import { cookies } from "next/headers"

import { ResetPasswordForm } from "@/app/reset-password/reset-password-form"
import { passwordRecoveryCookieName } from "@/lib/auth/recovery"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function ResetPasswordPage() {
  const cookieStore = await cookies()
  const hasRecoveryTicket = cookieStore.get(passwordRecoveryCookieName)?.value === "1"
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !hasRecoveryTicket) {
    redirect("/login?reset=0")
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f7f7f4] px-4 py-10">
      <ResetPasswordForm />
    </main>
  )
}
