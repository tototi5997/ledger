"use server"

import { revalidatePath } from "next/cache"

import { getCurrentUserOrRedirect, getDefaultLedgerId } from "@/lib/ledger/queries"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { fundingSourceIdSchema, fundingSourceSchema } from "@/lib/validations/funding-source"

export type FundingSourceActionState = {
  message: string
}

const fallbackMessage = "操作失败，请稍后重试"

export async function createFundingSourceAction(
  _previousState: FundingSourceActionState,
  formData: FormData
): Promise<FundingSourceActionState> {
  const parsed = fundingSourceSchema.safeParse({
    name: formData.get("name"),
  })

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? fallbackMessage }
  }

  const supabase = await createSupabaseServerClient()
  const user = await getCurrentUserOrRedirect(supabase)
  const ledgerId = await getDefaultLedgerId(supabase, user)
  const { error } = await supabase.from("funding_sources").insert({
    ledger_id: ledgerId,
    name: parsed.data.name,
    created_by: user.id,
  })

  if (error) {
    if (error.code === "23505") {
      return { message: "该资金渠道已存在" }
    }

    return { message: error.message || fallbackMessage }
  }

  revalidateFundingSourcePages()

  return { message: "" }
}

export async function updateFundingSourceAction(
  _previousState: FundingSourceActionState,
  formData: FormData
): Promise<FundingSourceActionState> {
  const idParsed = fundingSourceIdSchema.safeParse(formData.get("id"))
  const bodyParsed = fundingSourceSchema.safeParse({
    name: formData.get("name"),
  })

  if (!idParsed.success) {
    return { message: idParsed.error.issues[0]?.message ?? fallbackMessage }
  }

  if (!bodyParsed.success) {
    return { message: bodyParsed.error.issues[0]?.message ?? fallbackMessage }
  }

  const supabase = await createSupabaseServerClient()
  const user = await getCurrentUserOrRedirect(supabase)
  const ledgerId = await getDefaultLedgerId(supabase, user)
  const { error } = await supabase
    .from("funding_sources")
    .update({
      name: bodyParsed.data.name,
      hidden_at: null,
    })
    .eq("id", idParsed.data)
    .eq("ledger_id", ledgerId)

  if (error) {
    if (error.code === "23505") {
      return { message: "该资金渠道已存在" }
    }

    return { message: error.message || fallbackMessage }
  }

  revalidateFundingSourcePages()

  return { message: "" }
}

export async function hideFundingSourceAction(formData: FormData) {
  const parsed = fundingSourceIdSchema.safeParse(formData.get("id"))

  if (!parsed.success) {
    return
  }

  const supabase = await createSupabaseServerClient()
  const user = await getCurrentUserOrRedirect(supabase)
  const ledgerId = await getDefaultLedgerId(supabase, user)

  await supabase
    .from("funding_sources")
    .update({
      hidden_at: new Date().toISOString(),
    })
    .eq("id", parsed.data)
    .eq("ledger_id", ledgerId)

  revalidateFundingSourcePages()
}

export async function deleteFundingSourceAction(
  _previousState: FundingSourceActionState,
  formData: FormData
): Promise<FundingSourceActionState> {
  const parsed = fundingSourceIdSchema.safeParse(formData.get("id"))

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? fallbackMessage }
  }

  const supabase = await createSupabaseServerClient()
  const user = await getCurrentUserOrRedirect(supabase)
  const ledgerId = await getDefaultLedgerId(supabase, user)
  const { data: source, error: sourceError } = await supabase
    .from("funding_sources")
    .select("id")
    .eq("id", parsed.data)
    .eq("ledger_id", ledgerId)
    .maybeSingle()

  if (sourceError || !source) {
    return { message: "资金渠道不存在或无权访问" }
  }

  const { count, error: countError } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("ledger_id", ledgerId)
    .eq("funding_source_id", parsed.data)

  if (countError) {
    return { message: countError.message || fallbackMessage }
  }

  if ((count ?? 0) > 0) {
    return { message: "该资金渠道已被交易使用，无法删除，可选择隐藏" }
  }

  const { count: snapshotCount, error: snapshotCountError } = await supabase
    .from("funding_source_balance_snapshots")
    .select("id", { count: "exact", head: true })
    .eq("ledger_id", ledgerId)
    .eq("funding_source_id", parsed.data)
    .is("deleted_at", null)

  if (snapshotCountError) {
    return { message: snapshotCountError.message || fallbackMessage }
  }

  if ((snapshotCount ?? 0) > 0) {
    return { message: "该资金渠道已有资产余额记录，无法删除，可选择隐藏" }
  }

  const { error } = await supabase
    .from("funding_sources")
    .delete()
    .eq("id", parsed.data)
    .eq("ledger_id", ledgerId)

  if (error) {
    return { message: error.message || fallbackMessage }
  }

  revalidateFundingSourcePages()

  return { message: "" }
}

function revalidateFundingSourcePages() {
  revalidatePath("/")
  revalidatePath("/assets")
  revalidatePath("/settings")
  revalidatePath("/settings/funding-sources")
  revalidatePath("/transactions/new")
  revalidatePath("/analytics")
}
