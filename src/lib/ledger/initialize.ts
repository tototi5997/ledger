import { DEFAULT_EXPENSE_TAGS, DEFAULT_FUNDING_SOURCES, DEFAULT_INCOME_TAGS, DEFAULT_LEDGER_NAME } from "@/lib/ledger/defaults"
import type { createSupabaseServerClient } from "@/lib/supabase/server"

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

export async function ensureUserWorkspace(
  supabase: SupabaseServerClient,
  user: {
    id: string
    email?: string | null
  }
) {
  await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  )

  const { data: existingLedger, error: ledgerQueryError } = await supabase
    .from("ledgers")
    .select("id")
    .eq("created_by", user.id)
    .eq("is_default", true)
    .maybeSingle()

  if (ledgerQueryError) {
    throw ledgerQueryError
  }

  let ledgerId = existingLedger?.id

  if (!ledgerId) {
    const { data: createdLedger, error: createLedgerError } = await supabase
      .from("ledgers")
      .insert({
        name: DEFAULT_LEDGER_NAME,
        currency: "CNY",
        created_by: user.id,
        is_default: true,
      })
      .select("id")
      .single()

    if (createLedgerError) {
      throw createLedgerError
    }

    ledgerId = createdLedger.id
  }

  await ensureDefaultFundingSources(supabase, ledgerId, user.id)
  await ensureDefaultCategoryTags(supabase, ledgerId, user.id)

  return ledgerId
}

async function ensureDefaultFundingSources(
  supabase: SupabaseServerClient,
  ledgerId: string,
  userId: string
) {
  const { data: existingSources, error } = await supabase
    .from("funding_sources")
    .select("name")
    .eq("ledger_id", ledgerId)

  if (error) {
    throw error
  }

  const existingNames = new Set(existingSources?.map((source) => source.name) ?? [])
  const missingSources = DEFAULT_FUNDING_SOURCES.filter((name) => !existingNames.has(name))

  if (missingSources.length === 0) {
    return
  }

  const { error: insertError } = await supabase.from("funding_sources").insert(
    missingSources.map((name) => ({
      ledger_id: ledgerId,
      name,
      created_by: userId,
    }))
  )

  if (insertError) {
    throw insertError
  }
}

async function ensureDefaultCategoryTags(
  supabase: SupabaseServerClient,
  ledgerId: string,
  userId: string
) {
  const { data: existingTags, error } = await supabase
    .from("category_tags")
    .select("name,type")
    .eq("ledger_id", ledgerId)

  if (error) {
    throw error
  }

  const existingKeys = new Set(existingTags?.map((tag) => `${tag.type}:${tag.name}`) ?? [])
  const expenseTags = DEFAULT_EXPENSE_TAGS.filter((name) => !existingKeys.has(`expense:${name}`)).map((name) => ({
    ledger_id: ledgerId,
    name,
    type: "expense" as const,
    created_by: userId,
  }))
  const incomeTags = DEFAULT_INCOME_TAGS.filter((name) => !existingKeys.has(`income:${name}`)).map((name) => ({
    ledger_id: ledgerId,
    name,
    type: "income" as const,
    created_by: userId,
  }))
  const tags = [...expenseTags, ...incomeTags]

  if (tags.length === 0) {
    return
  }

  const { error: insertError } = await supabase.from("category_tags").insert(tags)

  if (insertError) {
    throw insertError
  }
}
