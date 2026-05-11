import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { hasSupabaseEnv } from "@/lib/env"
import { getCurrentUserOrRedirect, getDefaultLedgerId } from "@/lib/ledger/queries"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type RecentTransaction = {
  id: string
  type: "expense" | "income"
  amount: string
  transaction_date: string
  funding_sources: {
    name: string
  } | null
  category_tags: {
    name: string
  } | null
}

export default async function HomePage() {
  if (!hasSupabaseEnv()) {
    return <SetupNotice />
  }

  const supabase = await createSupabaseServerClient()
  const user = await getCurrentUserOrRedirect(supabase)
  const ledgerId = await getDefaultLedgerId(supabase, user)
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10)
  const [{ data: monthlyTransactions, error: monthlyError }, { data: recentTransactions, error: recentError }] =
    await Promise.all([
      supabase
        .from("transactions")
        .select("type,amount")
        .eq("ledger_id", ledgerId)
        .is("deleted_at", null)
        .gte("transaction_date", monthStart)
        .lt("transaction_date", nextMonthStart),
      supabase
        .from("transactions")
        .select("id,type,amount,transaction_date,note,funding_sources(name),category_tags(name)")
        .eq("ledger_id", ledgerId)
        .is("deleted_at", null)
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5),
    ])

  if (monthlyError) {
    throw monthlyError
  }

  if (recentError) {
    throw recentError
  }

  const monthly = (monthlyTransactions ?? []).reduce(
    (result, transaction) => {
      const amount = Number(transaction.amount)

      if (transaction.type === "income") {
        result.income += amount
      } else {
        result.expense += amount
      }

      return result
    },
    { income: 0, expense: 0 }
  )
  const balance = monthly.income - monthly.expense
  const recent = (recentTransactions ?? []) as RecentTransaction[]

  return (
    <main className="min-h-dvh bg-[#f7f7f4] px-4 py-6 text-foreground">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex items-center justify-between">
          <Link href="/settings" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            设置
          </Link>
          <Link className={buttonVariants()} href="/transactions/new">
            新增记账
          </Link>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard title="本月收入" value={formatCurrency(monthly.income)} />
          <SummaryCard title="本月支出" value={formatCurrency(monthly.expense)} />
          <SummaryCard title="本月结余" value={formatCurrency(balance)} />
        </div>

        <div className="rounded-3xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">最近交易</h2>
            <Link href="/transactions" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              查看全部
            </Link>
          </div>
          {recent.length > 0 ? (
            <div className="mt-4 divide-y">
              {recent.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium">
                      {transaction.category_tags?.name ?? "未命名标签"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {transaction.funding_sources?.name ?? "未知渠道"} · {transaction.transaction_date}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {transaction.type === "income" ? "+" : "-"}
                    {Number(transaction.amount).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              暂无交易。点击右上角“新增记账”记录第一笔收支。
            </p>
          )}
        </div>
      </section>
    </main>
  )
}

function formatCurrency(value: number) {
  return `¥${value.toFixed(2)}`
}

function SetupNotice() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f7f7f4] px-4 py-10">
      <section className="w-full max-w-xl rounded-3xl border bg-card p-6">
        <p className="text-sm text-muted-foreground">Ledger</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">项目已初始化</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          请在 `.env.local` 中配置 Supabase 环境变量，然后访问登录页开始注册和初始化个人账本。
        </p>
        <Link className={buttonVariants({ className: "mt-6" })} href="/login">
          进入登录页
        </Link>
      </section>
    </main>
  )
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  )
}
