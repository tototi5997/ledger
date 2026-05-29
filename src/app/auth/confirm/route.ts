import { type EmailOtpType } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

import {
  passwordRecoveryCookieName,
  passwordRecoveryCookieOptions,
} from "@/lib/auth/recovery"
import { ensureUserWorkspace } from "@/lib/ledger/initialize"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const tokenHash = requestUrl.searchParams.get("token_hash")
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null
  const next = getSafeNextPath(requestUrl.searchParams.get("next"))
  const redirectUrl = request.nextUrl.clone()

  redirectUrl.pathname = "/login"
  redirectUrl.search = type === "recovery" ? "?reset=0" : "?verified=0"

  if (!tokenHash || !type) {
    return NextResponse.redirect(redirectUrl)
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  })

  if (error || !data.user) {
    return NextResponse.redirect(redirectUrl)
  }

  if (type === "email") {
    await ensureUserWorkspace(supabase, {
      id: data.user.id,
      email: data.user.email,
    })
  }

  redirectUrl.pathname = next
  redirectUrl.search = next === "/login" ? "?verified=1" : ""

  const response = NextResponse.redirect(redirectUrl)

  if (type === "recovery" && next === "/reset-password") {
    response.cookies.set(passwordRecoveryCookieName, "1", {
      ...passwordRecoveryCookieOptions,
      secure: requestUrl.protocol === "https:",
    })
  }

  return response
}

function getSafeNextPath(value: string | null) {
  if (!value) {
    return "/"
  }

  try {
    const parsedUrl = new URL(value)

    return parsedUrl.origin === getSiteOrigin() ? parsedUrl.pathname : "/"
  } catch {
    if (!value.startsWith("/") || value.startsWith("//")) {
      return "/"
    }

    return value
  }
}

function getSiteOrigin() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

  return new URL(siteUrl).origin
}
