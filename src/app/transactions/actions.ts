"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { TRANSACTIONS_PAGE_SIZE } from "@/app/transactions/constants"
import type { TransactionRow } from "@/app/transactions/types"
import { getCurrentUserOrRedirect, getDefaultLedgerId } from "@/lib/ledger/queries"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { transactionFormSchema } from "@/lib/validations/transaction"

export type TransactionActionState = {
  message: string
}

const fallbackMessage = "保存失败，请稍后重试"

export async function createTransactionAction(
  _previousState: TransactionActionState,
  formData: FormData
): Promise<TransactionActionState> {
  const parsed = transactionFormSchema.safeParse({
    type: formData.get("type"),
    fundingSourceId: formData.get("fundingSourceId"),
    amount: formData.get("amount"),
    categoryTagId: formData.get("categoryTagId"),
    transactionDate: formData.get("transactionDate"),
    note: formData.get("note") ?? "",
  })

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? fallbackMessage }
  }

  const supabase = await createSupabaseServerClient()
  const user = await getCurrentUserOrRedirect(supabase)
  const ledgerId = await getDefaultLedgerId(supabase, user)
  const validationMessage = await validateTransactionRelations(supabase, {
    ledgerId,
    type: parsed.data.type,
    fundingSourceId: parsed.data.fundingSourceId,
    categoryTagId: parsed.data.categoryTagId,
  })

  if (validationMessage) {
    return { message: validationMessage }
  }

  const { error } = await supabase.from("transactions").insert({
    ledger_id: ledgerId,
    type: parsed.data.type,
    amount: parsed.data.amount,
    currency: "CNY",
    funding_source_id: parsed.data.fundingSourceId,
    category_tag_id: parsed.data.categoryTagId,
    transaction_date: parsed.data.transactionDate,
    note: parsed.data.note || null,
    created_by: user.id,
  })

  if (error) {
    return { message: error.message || fallbackMessage }
  }

  revalidatePath("/")
  revalidatePath("/transactions")
  redirect("/transactions")
}

export async function updateTransactionAction(
  _previousState: TransactionActionState,
  formData: FormData
): Promise<TransactionActionState> {
  const id = formData.get("id")
  const parsed = transactionFormSchema.safeParse({
    type: formData.get("type"),
    fundingSourceId: formData.get("fundingSourceId"),
    amount: formData.get("amount"),
    categoryTagId: formData.get("categoryTagId"),
    transactionDate: formData.get("transactionDate"),
    note: formData.get("note") ?? "",
  })

  if (typeof id !== "string") {
    return { message: "交易不存在" }
  }

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? fallbackMessage }
  }

  const supabase = await createSupabaseServerClient()
  const user = await getCurrentUserOrRedirect(supabase)
  const ledgerId = await getDefaultLedgerId(supabase, user)
  const validationMessage = await validateTransactionRelations(supabase, {
    ledgerId,
    type: parsed.data.type,
    fundingSourceId: parsed.data.fundingSourceId,
    categoryTagId: parsed.data.categoryTagId,
  })

  if (validationMessage) {
    return { message: validationMessage }
  }

  const { error } = await supabase
    .from("transactions")
    .update({
      type: parsed.data.type,
      amount: parsed.data.amount,
      funding_source_id: parsed.data.fundingSourceId,
      category_tag_id: parsed.data.categoryTagId,
      transaction_date: parsed.data.transactionDate,
      note: parsed.data.note || null,
      deleted_at: null,
    })
    .eq("id", id)
    .eq("ledger_id", ledgerId)

  if (error) {
    return { message: error.message || fallbackMessage }
  }

  revalidatePath("/")
  revalidatePath("/transactions")
  redirect("/transactions")
}

export async function deleteTransactionAction(
  _previousState: TransactionActionState,
  formData: FormData
): Promise<TransactionActionState> {
  const id = formData.get("id")

  if (typeof id !== "string") {
    return { message: "交易不存在" }
  }

  const supabase = await createSupabaseServerClient()
  const user = await getCurrentUserOrRedirect(supabase)
  const ledgerId = await getDefaultLedgerId(supabase, user)
  const { error } = await supabase
    .from("transactions")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("ledger_id", ledgerId)

  if (error) {
    return { message: error.message || "删除失败，请稍后重试" }
  }

  revalidatePath("/")
  revalidatePath("/transactions")
  redirect("/transactions")
}

export async function loadTransactionsPage(page: number) {
  const safePage = Math.max(0, page)
  const from = safePage * TRANSACTIONS_PAGE_SIZE
  const to = from + TRANSACTIONS_PAGE_SIZE - 1
  const supabase = await createSupabaseServerClient()
  const user = await getCurrentUserOrRedirect(supabase)
  const ledgerId = await getDefaultLedgerId(supabase, user)
  const { data, error } = await supabase
    .from("transactions")
    .select("id,type,amount,transaction_date,note,funding_sources(name),category_tags(name)")
    .eq("ledger_id", ledgerId)
    .is("deleted_at", null)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) {
    throw error
  }

  const transactions = (data ?? []) as TransactionRow[]

  return {
    transactions,
    hasMore: transactions.length === TRANSACTIONS_PAGE_SIZE,
  }
}

async function validateTransactionRelations(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  {
    ledgerId,
    type,
    fundingSourceId,
    categoryTagId,
  }: {
    ledgerId: string
    type: "expense" | "income"
    fundingSourceId: string
    categoryTagId: string
  }
) {
  const { data: fundingSource, error: fundingSourceError } = await supabase
    .from("funding_sources")
    .select("id")
    .eq("id", fundingSourceId)
    .eq("ledger_id", ledgerId)
    .maybeSingle()

  if (fundingSourceError || !fundingSource) {
    return "资金渠道不存在或无权访问"
  }

  const { data: categoryTag, error: categoryTagError } = await supabase
    .from("category_tags")
    .select("id,type")
    .eq("id", categoryTagId)
    .eq("ledger_id", ledgerId)
    .maybeSingle()

  if (categoryTagError || !categoryTag) {
    return "分类标签不存在或无权访问"
  }

  if (categoryTag.type !== type) {
    return "分类标签类型必须和交易类型一致"
  }

  return ""
}
