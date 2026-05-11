import Link from "next/link"
import { notFound } from "next/navigation"

import { DeleteTransactionForm, TransactionForm } from "@/app/transactions/new/transaction-form"
import { getCurrentUserOrRedirect, getDefaultLedgerId, getTransactionFormOptions } from "@/lib/ledger/queries"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const user = await getCurrentUserOrRedirect(supabase)
  const ledgerId = await getDefaultLedgerId(supabase, user)
  const { data: transaction, error } = await supabase
    .from("transactions")
    .select("id,type,amount,funding_source_id,category_tag_id,transaction_date,note")
    .eq("id", id)
    .eq("ledger_id", ledgerId)
    .is("deleted_at", null)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!transaction) {
    notFound()
  }

  const { fundingSources, categoryTags } = await getTransactionFormOptions(supabase, ledgerId, {
    fundingSourceId: transaction.funding_source_id,
    categoryTagId: transaction.category_tag_id,
  })

  return (
    <main className="min-h-dvh bg-[#f7f7f4] px-4 py-6">
      <section className="mx-auto w-full max-w-xl">
        <Link href="/transactions" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          返回交易列表
        </Link>
        <div className="mt-5 mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">编辑交易</p>
            <h1 className="text-3xl font-semibold tracking-tight">修改收支记录</h1>
          </div>
          <DeleteTransactionForm id={transaction.id} compact />
        </div>
        <TransactionForm
          mode="edit"
          fundingSources={fundingSources}
          categoryTags={categoryTags}
          initialValue={{
            id: transaction.id,
            type: transaction.type,
            amount: Number(transaction.amount).toFixed(2),
            fundingSourceId: transaction.funding_source_id,
            categoryTagId: transaction.category_tag_id,
            transactionDate: transaction.transaction_date,
            note: transaction.note ?? "",
          }}
        />
      </section>
    </main>
  )
}
