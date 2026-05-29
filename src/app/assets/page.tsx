import Link from "next/link"

import { AssetsTrendChart } from "@/app/assets/assets-chart"
import { BalanceSnapshotForm } from "@/app/assets/balance-snapshot-form"
import { buttonVariants } from "@/components/ui/button"
import {
  type AssetFundingSource,
  type AssetSnapshot,
  type AssetTransaction,
  buildAssetSummary,
} from "@/lib/assets/summary"
import { getCurrentUserOrRedirect, getDefaultLedgerId } from "@/lib/ledger/queries"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function AssetsPage() {
  const supabase = await createSupabaseServerClient()
  const user = await getCurrentUserOrRedirect(supabase)
  const ledgerId = await getDefaultLedgerId(supabase, user)
  const today = formatDate(new Date())
  const [
    { data: fundingSourcesData, error: fundingSourcesError },
    { data: snapshotsData, error: snapshotsError },
  ] = await Promise.all([
    supabase
      .from("funding_sources")
      .select("id,name,hidden_at")
      .eq("ledger_id", ledgerId)
      .order("created_at", { ascending: true }),
    supabase
      .from("funding_source_balance_snapshots")
      .select("id,funding_source_id,balance_amount,snapshot_date,note,created_at,updated_at")
      .eq("ledger_id", ledgerId)
      .is("deleted_at", null)
      .lte("snapshot_date", today)
      .order("snapshot_date", { ascending: true }),
  ])

  if (fundingSourcesError) {
    throw fundingSourcesError
  }

  if (snapshotsError) {
    throw snapshotsError
  }

  const fundingSources = (fundingSourcesData ?? []) as AssetFundingSource[]
  const snapshots = (snapshotsData ?? []) as AssetSnapshot[]
  const transactionStartDate = getTransactionStartDate(snapshots, today)
  const { data: transactionsData, error: transactionsError } = transactionStartDate
    ? await supabase
        .from("transactions")
        .select("type,amount,funding_source_id,transaction_date")
        .eq("ledger_id", ledgerId)
        .is("deleted_at", null)
        .gte("transaction_date", transactionStartDate)
        .lte("transaction_date", today)
    : { data: [], error: null }

  if (transactionsError) {
    throw transactionsError
  }

  const transactions = (transactionsData ?? []) as AssetTransaction[]
  const summary = buildAssetSummary({
    sources: fundingSources,
    snapshots,
    transactions,
    today,
  })

  return (
    <main className="min-h-dvh bg-[#f7f7f4] px-4 py-6">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              返回首页
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">资产</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              查看资金渠道余额、总资产和最近 30 天的变化趋势。
            </p>
          </div>
          <Link className={buttonVariants({ variant: "outline" })} href="/settings/funding-sources">
            管理资金渠道
          </Link>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard title="当前总资产" value={summary.hasAnySnapshot ? formatCurrency(summary.totalBalance) : "未设置"} />
          <SummaryCard title="本月变化" value={formatNullableCurrency(summary.monthChange)} />
          <SummaryCard
            title="最近校准"
            value={summary.lastSnapshotDate ? formatDisplayDate(summary.lastSnapshotDate) : "暂无"}
          />
        </section>

        {!summary.hasAnySnapshot ? (
          <section className="rounded-3xl border bg-card p-8 text-center">
            <h2 className="text-xl font-semibold">先设置一笔余额</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              为常用资金渠道设置当前余额后，资产页会根据后续收入和支出自动计算总资产变化。
            </p>
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="space-y-6">
            <section className="rounded-3xl border bg-card p-5">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold">总资产趋势</h2>
                <p className="text-sm text-muted-foreground">最近 30 天每日结束时的总资产。</p>
              </div>
              <div className="mt-5">
                <AssetsTrendChart data={summary.trend} />
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl border bg-card">
              <div className="border-b px-5 py-4">
                <h2 className="text-xl font-semibold">资金渠道余额</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  已设置余额的渠道会纳入总资产，未设置的渠道暂不参与计算。
                </p>
              </div>
              {summary.channels.length > 0 ? (
                <div className="divide-y">
                  {summary.channels.map((channel) => (
                    <article key={channel.id} className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium">{channel.name}</h3>
                          {channel.hiddenAt ? (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              已隐藏
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {channel.latestSnapshotDate
                            ? `最近校准 ${formatDisplayDate(channel.latestSnapshotDate)}`
                            : "未设置余额"}
                        </p>
                        {channel.latestSnapshotNote ? (
                          <p className="mt-1 text-xs text-muted-foreground">{channel.latestSnapshotNote}</p>
                        ) : null}
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xl font-semibold">
                          {channel.currentBalance === null ? "未设置" : formatCurrency(channel.currentBalance)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          本月变化 {formatNullableCurrency(channel.monthChange)}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  暂无资金渠道，请先在设置中新增资金渠道。
                </div>
              )}
            </section>
          </div>

          <aside>
            <BalanceSnapshotForm fundingSources={fundingSources} />
          </aside>
        </section>
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

function getTransactionStartDate(snapshots: AssetSnapshot[], today: string) {
  if (snapshots.length === 0) {
    return null
  }

  const earliestSnapshotDate = snapshots.reduce((earliest, snapshot) =>
    snapshot.snapshot_date < earliest ? snapshot.snapshot_date : earliest,
  snapshots[0].snapshot_date)
  const monthStart = `${today.slice(0, 7)}-01`

  return earliestSnapshotDate < monthStart ? earliestSnapshotDate : monthStart
}

function formatCurrency(value: number) {
  return `¥${value.toFixed(2)}`
}

function formatNullableCurrency(value: number | null) {
  if (value === null) {
    return "未设置"
  }

  const prefix = value > 0 ? "+" : ""

  return `${prefix}${formatCurrency(value)}`
}

function formatDisplayDate(date: string) {
  return `${date.slice(0, 4)}年${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日`
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}
