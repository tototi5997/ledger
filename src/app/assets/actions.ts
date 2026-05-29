"use server"

import { revalidatePath } from "next/cache"

import { getCurrentUserOrRedirect, getDefaultLedgerId } from "@/lib/ledger/queries"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { balanceSnapshotFormSchema } from "@/lib/validations/asset"

export type BalanceSnapshotActionState = {
  message: string
}

const fallbackMessage = "保存失败，请稍后重试"

export async function saveBalanceSnapshotAction(
  _previousState: BalanceSnapshotActionState,
  formData: FormData
): Promise<BalanceSnapshotActionState> {
  const parsed = balanceSnapshotFormSchema.safeParse({
    fundingSourceId: formData.get("fundingSourceId"),
    balanceAmount: formData.get("balanceAmount"),
    snapshotDate: formData.get("snapshotDate"),
    note: formData.get("note") ?? "",
  })

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? fallbackMessage }
  }

  const supabase = await createSupabaseServerClient()
  const user = await getCurrentUserOrRedirect(supabase)
  const ledgerId = await getDefaultLedgerId(supabase, user)
  const { data: source, error: sourceError } = await supabase
    .from("funding_sources")
    .select("id")
    .eq("id", parsed.data.fundingSourceId)
    .eq("ledger_id", ledgerId)
    .maybeSingle()

  if (sourceError || !source) {
    return { message: "资金渠道不存在或无权访问" }
  }

  const payload = {
    balance_amount: parsed.data.balanceAmount,
    currency: "CNY",
    note: parsed.data.note || null,
    deleted_at: null,
  }
  const { data: existingSnapshot, error: existingError } = await supabase
    .from("funding_source_balance_snapshots")
    .select("id")
    .eq("ledger_id", ledgerId)
    .eq("funding_source_id", parsed.data.fundingSourceId)
    .eq("snapshot_date", parsed.data.snapshotDate)
    .is("deleted_at", null)
    .maybeSingle()

  if (existingError) {
    return { message: existingError.message || fallbackMessage }
  }

  const result = existingSnapshot
    ? await supabase
        .from("funding_source_balance_snapshots")
        .update(payload)
        .eq("id", existingSnapshot.id)
        .eq("ledger_id", ledgerId)
    : await supabase.from("funding_source_balance_snapshots").insert({
        ledger_id: ledgerId,
        funding_source_id: parsed.data.fundingSourceId,
        snapshot_date: parsed.data.snapshotDate,
        created_by: user.id,
        ...payload,
      })

  if (result.error) {
    if (result.error.code === "23505") {
      return { message: "该资金渠道当天已设置余额" }
    }

    return { message: result.error.message || fallbackMessage }
  }

  revalidatePath("/")
  revalidatePath("/assets")
  revalidatePath("/settings/funding-sources")

  return { message: "" }
}
