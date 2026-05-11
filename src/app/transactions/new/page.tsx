import Link from "next/link"

import { TransactionForm } from "@/app/transactions/new/transaction-form"
import { getCurrentUserOrRedirect, getDefaultLedgerId, getTransactionFormOptions } from "@/lib/ledger/queries"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function NewTransactionPage() {
  const supabase = await createSupabaseServerClient()
  const user = await getCurrentUserOrRedirect(supabase)
  const ledgerId = await getDefaultLedgerId(supabase, user)
  const { fundingSources, categoryTags } = await getTransactionFormOptions(supabase, ledgerId)

  return (
    <main className="min-h-dvh bg-[#f7f7f4] px-4 py-6">
      <section className="mx-auto w-full max-w-xl">
        <Link href="/" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          返回首页
        </Link>
        <div className="mt-5 mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">记录一笔收支</h1>
        </div>
        <TransactionForm fundingSources={fundingSources} categoryTags={categoryTags} />
      </section>
    </main>
  )
}
