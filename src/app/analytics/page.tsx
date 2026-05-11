import Link from "next/link"

import {
  CategorySummaryChart,
  DailyTrendChart,
  FundingSourceChart,
} from "@/app/analytics/analytics-charts"
import { buttonVariants } from "@/components/ui/button"
import { getCurrentUserOrRedirect, getDefaultLedgerId } from "@/lib/ledger/queries"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type SearchParams = Promise<{
  year?: string | string[]
  month?: string | string[]
}>

type AnalyticsTransaction = {
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

type RankingItem = {
  name: string
  income: number
  expense: number
}

type DailyItem = {
  day: string
  income: number
  expense: number
  balance: number
}

export default async function AnalyticsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const selectedMonth = getSelectedMonth(params)
  const supabase = await createSupabaseServerClient()
  const user = await getCurrentUserOrRedirect(supabase)
  const ledgerId = await getDefaultLedgerId(supabase, user)
  const { data, error } = await supabase
    .from("transactions")
    .select("type,amount,transaction_date,funding_sources(name),category_tags(name)")
    .eq("ledger_id", ledgerId)
    .is("deleted_at", null)
    .gte("transaction_date", selectedMonth.start)
    .lt("transaction_date", selectedMonth.nextStart)
    .order("transaction_date", { ascending: true })

  if (error) {
    throw error
  }

  const transactions = (data ?? []) as AnalyticsTransaction[]
  const summary = buildAnalyticsSummary(transactions, selectedMonth.daysInMonth)
  const hasTransactions = transactions.length > 0

  return (
    <main className="min-h-dvh bg-[#f7f7f4] px-4 py-6">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              返回首页
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">统计</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              查看指定年月的收支概览、渠道汇总、分类汇总和每日趋势。
            </p>
          </div>
          <MonthSelector year={selectedMonth.year} month={selectedMonth.month} />
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard title="月度收入" value={formatCurrency(summary.income)} />
          <SummaryCard title="月度支出" value={formatCurrency(summary.expense)} />
          <SummaryCard title="月度结余" value={formatCurrency(summary.balance)} />
        </div>

        {!hasTransactions ? (
          <section className="rounded-3xl border bg-card p-8 text-center">
            <h2 className="text-xl font-semibold">本月无交易</h2>
            <p className="mt-2 text-sm text-muted-foreground">切换年份或月份可以查看其他时间段的统计。</p>
          </section>
        ) : (
          <>
            <section className="grid gap-4 lg:grid-cols-3">
              <ChartCard title="资金渠道汇总" description="按资金渠道汇总收入、支出和结余。">
                <FundingSourceChart data={summary.fundingSources} />
                <RankingList items={summary.fundingSources} />
              </ChartCard>
              <ChartCard title="支出分类汇总" description="按支出分类汇总本月消费。">
                <CategorySummaryChart data={summary.expenseCategories} />
                <RankingList items={summary.expenseCategories} />
              </ChartCard>
              <ChartCard title="收入分类汇总" description="按收入分类汇总本月进账。">
                <CategorySummaryChart data={summary.incomeCategories} />
                <RankingList items={summary.incomeCategories} />
              </ChartCard>
            </section>

            <ChartCard title="每日趋势" description="展示每日收入、支出和结余变化。">
              <DailyTrendChart data={summary.dailyTrend} />
            </ChartCard>
          </>
        )}
      </section>
    </main>
  )
}

function MonthSelector({ year, month }: { year: number; month: number }) {
  const currentYear = new Date().getFullYear()
  const years = Array.from(new Set([year, ...Array.from({ length: 12 }, (_, index) => currentYear - 10 + index)])).sort(
    (left, right) => left - right
  )
  const months = Array.from({ length: 12 }, (_, index) => index + 1)

  return (
    <form className="flex items-end gap-3" action="/analytics">
      <label className="grid gap-1 text-sm">
        <span className="text-muted-foreground">年份</span>
        <select
          name="year"
          defaultValue={year}
          className="h-9 rounded-lg border bg-card px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {years.map((yearOption) => (
            <option key={yearOption} value={yearOption}>
              {yearOption}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-muted-foreground">月份</span>
        <select
          name="month"
          defaultValue={month}
          className="h-9 rounded-lg border bg-card px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {months.map((monthOption) => (
            <option key={monthOption} value={monthOption}>
              {monthOption} 月
            </option>
          ))}
        </select>
      </label>
      <button className={buttonVariants({ className: "h-9" })} type="submit">
        查看
      </button>
    </form>
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

function ChartCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-3xl border bg-card p-5">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function RankingList({ items }: { items: RankingItem[] }) {
  if (items.length === 0) {
    return <p className="mt-4 text-sm text-muted-foreground">暂无数据</p>
  }

  return (
    <div className="mt-4 divide-y">
      {items.slice(0, 6).map((item) => (
        <div key={item.name} className="grid grid-cols-[1fr_auto] gap-3 py-3 text-sm">
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              收入 {formatCurrency(item.income)} · 支出 {formatCurrency(item.expense)}
            </p>
          </div>
          <p className="font-semibold">{formatCurrency(item.income - item.expense)}</p>
        </div>
      ))}
    </div>
  )
}

function buildAnalyticsSummary(transactions: AnalyticsTransaction[], daysInMonth: number) {
  const fundingSources = new Map<string, RankingItem>()
  const expenseCategories = new Map<string, RankingItem>()
  const incomeCategories = new Map<string, RankingItem>()
  const dailyTrend: DailyItem[] = Array.from({ length: daysInMonth }, (_, index) => ({
    day: String(index + 1),
    income: 0,
    expense: 0,
    balance: 0,
  }))
  let income = 0
  let expense = 0

  for (const transaction of transactions) {
    const amount = Number(transaction.amount)
    const dayIndex = Number(transaction.transaction_date.slice(8, 10)) - 1
    const fundingSourceName = transaction.funding_sources?.name ?? "未知渠道"
    const categoryName = transaction.category_tags?.name ?? "未命名标签"

    if (transaction.type === "income") {
      income += amount
      dailyTrend[dayIndex].income += amount
    } else {
      expense += amount
      dailyTrend[dayIndex].expense += amount
    }

    addRankingAmount(fundingSources, fundingSourceName, transaction.type, amount)
    addRankingAmount(
      transaction.type === "income" ? incomeCategories : expenseCategories,
      categoryName,
      transaction.type,
      amount
    )
  }

  for (const day of dailyTrend) {
    day.balance = day.income - day.expense
  }

  return {
    income,
    expense,
    balance: income - expense,
    fundingSources: sortRankingItems([...fundingSources.values()]),
    expenseCategories: sortRankingItems([...expenseCategories.values()]),
    incomeCategories: sortRankingItems([...incomeCategories.values()]),
    dailyTrend,
  }
}

function addRankingAmount(
  map: Map<string, RankingItem>,
  name: string,
  type: "expense" | "income",
  amount: number
) {
  const item = map.get(name) ?? {
    name,
    income: 0,
    expense: 0,
  }

  item[type] += amount
  map.set(name, item)
}

function sortRankingItems(items: RankingItem[]) {
  return items.sort((left, right) => {
    const leftTotal = left.income + left.expense
    const rightTotal = right.income + right.expense

    return rightTotal - leftTotal
  })
}

function getSelectedMonth(params: Awaited<SearchParams>) {
  const now = new Date()
  const parsedYear = readNumberParam(params.year)
  const parsedMonth = readNumberParam(params.month)
  const year = parsedYear && parsedYear >= 2000 && parsedYear <= 2100 ? parsedYear : now.getFullYear()
  const month = parsedMonth && parsedMonth >= 1 && parsedMonth <= 12 ? parsedMonth : now.getMonth() + 1
  const startDate = new Date(year, month - 1, 1)
  const nextStartDate = new Date(year, month, 1)
  const daysInMonth = new Date(year, month, 0).getDate()

  return {
    year,
    month,
    daysInMonth,
    start: formatDate(startDate),
    nextStart: formatDate(nextStartDate),
  }
}

function readNumberParam(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value

  if (!rawValue) {
    return null
  }

  const numericValue = Number(rawValue)

  return Number.isInteger(numericValue) ? numericValue : null
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function formatCurrency(value: number) {
  return `¥${value.toFixed(2)}`
}
