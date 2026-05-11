import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

import { getSupabaseEnv } from "@/lib/env"
import type { Database } from "@/types/database"

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv()

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Component 中无法写 cookie；由 proxy 或 Server Action 负责刷新会话。
        }
      },
    },
  })
}
