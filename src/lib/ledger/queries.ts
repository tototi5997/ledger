import { redirect } from "next/navigation"

import { ensureUserWorkspace } from "@/lib/ledger/initialize"
import type { createSupabaseServerClient } from "@/lib/supabase/server"

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

export async function getCurrentUserOrRedirect(supabase: SupabaseServerClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return user
}

export async function getDefaultLedgerId(
  supabase: SupabaseServerClient,
  user: {
    id: string
    email?: string | null
  }
) {
  const { data: existingLedger, error } = await supabase
    .from("ledgers")
    .select("id")
    .eq("created_by", user.id)
    .eq("is_default", true)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (existingLedger) {
    return existingLedger.id
  }

  return ensureUserWorkspace(supabase, {
    id: user.id,
    email: user.email,
  })
}

export async function getTransactionFormOptions(
  supabase: SupabaseServerClient,
  ledgerId: string,
  current?: {
    fundingSourceId?: string
    categoryTagId?: string
  }
) {
  const [fundingSourcesResult, categoryTagsResult] = await Promise.all([
    supabase
      .from("funding_sources")
      .select("id,name,hidden_at")
      .eq("ledger_id", ledgerId)
      .order("created_at", { ascending: true }),
    supabase
      .from("category_tags")
      .select("id,name,type,hidden_at")
      .eq("ledger_id", ledgerId)
      .order("created_at", { ascending: true }),
  ])

  if (fundingSourcesResult.error) {
    throw fundingSourcesResult.error
  }

  if (categoryTagsResult.error) {
    throw categoryTagsResult.error
  }

  return {
    fundingSources: fundingSourcesResult.data.filter(
      (source) => !source.hidden_at || source.id === current?.fundingSourceId
    ),
    categoryTags: categoryTagsResult.data.filter(
      (tag) => !tag.hidden_at || tag.id === current?.categoryTagId
    ),
  }
}
