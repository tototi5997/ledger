import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

import { getSupabaseEnv } from "@/lib/env"
import type { Database } from "@/types/database"

export async function updateSession(request: NextRequest) {
  if (isRouterPrefetch(request)) {
    return NextResponse.next()
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv()
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isLoginPage = pathname === "/login"
  const isAuthCallback = pathname.startsWith("/auth/")
  const isForgotPasswordPage = pathname === "/forgot-password"

  if (!user && !isLoginPage && !isAuthCallback && !isForgotPasswordPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (user && (isLoginPage || isForgotPasswordPage)) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return response
}

function isRouterPrefetch(request: NextRequest) {
  return (
    request.headers.get("next-router-prefetch") === "1" ||
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("sec-purpose") === "prefetch"
  )
}
