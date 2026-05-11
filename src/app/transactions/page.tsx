import Link from "next/link"

import { TRANSACTIONS_PAGE_SIZE } from "@/app/transactions/constants"
import { TransactionsList } from "@/app/transactions/transactions-list"
import type { TransactionRow } from "@/app/transactions/types"
import { buttonVariants } from "@/components/ui/button"
import { getCurrentUserOrRedirect, getDefaultLedgerId } from "@/lib/ledger/queries"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function TransactionsPage() {
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
    .range(0, TRANSACTIONS_PAGE_SIZE - 1)

  if (error) {
    throw error
  }

  const transactions = (data ?? []) as TransactionRow[]

  return (
    <main className="min-h-dvh bg-[#f7f7f4] px-4 py-6">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              返回首页
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">交易列表</h1>
            <p className="mt-2 text-sm text-muted-foreground">展示全部收入和支出，向下逐步加载。</p>
          </div>
          <Link className={buttonVariants()} href="/transactions/new">
            新增记账
          </Link>
        </header>

        {transactions.length > 0 ? (
          <TransactionsList
            initialTransactions={transactions}
            initialHasMore={transactions.length === TRANSACTIONS_PAGE_SIZE}
          />
        ) : (
          <div className="rounded-3xl border bg-card p-8 text-center">
            <h2 className="text-xl font-semibold">还没有交易</h2>
            <p className="mt-2 text-sm text-muted-foreground">先新增一笔收入或支出。</p>
            <Link className={buttonVariants({ className: "mt-5" })} href="/transactions/new">
              新增第一笔
            </Link>
          </div>
        )}
      </section>
    </main>
  )
}
