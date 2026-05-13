import Link from "next/link"

import { TRANSACTIONS_PAGE_SIZE } from "@/app/transactions/constants"
import {
  TransactionFilterDialog,
  type CategoryTagFilterOption,
  type FundingSourceFilterOption,
} from "@/app/transactions/transaction-filter-dialog"
import { TransactionsList } from "@/app/transactions/transactions-list"
import type { TransactionFilters, TransactionRow } from "@/app/transactions/types"
import { buttonVariants } from "@/components/ui/button"
import { getCurrentUserOrRedirect, getDefaultLedgerId } from "@/lib/ledger/queries"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type SearchParams = Promise<{
  year?: string | string[]
  month?: string | string[]
  type?: string | string[]
  fundingSourceId?: string | string[]
  categoryTagId?: string | string[]
}>

export default async function TransactionsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const filters = parseTransactionFilters(params)
  const supabase = await createSupabaseServerClient()
  const user = await getCurrentUserOrRedirect(supabase)
  const ledgerId = await getDefaultLedgerId(supabase, user)
  const [transactionsResult, fundingSourcesResult, categoryTagsResult] = await Promise.all([
    getTransactionsPage(supabase, ledgerId, filters),
    supabase
      .from("funding_sources")
      .select("id,name,hidden_at")
      .eq("ledger_id", ledgerId)
      .order("created_at", { ascending: true }),
    supabase
      .from("category_tags")
      .select("id,name,type,hidden_at")
      .eq("ledger_id", ledgerId)
      .order("created_at", { ascending: true }),
  ])

  if (transactionsResult.error) {
    throw transactionsResult.error
  }

  if (fundingSourcesResult.error) {
    throw fundingSourcesResult.error
  }

  if (categoryTagsResult.error) {
    throw categoryTagsResult.error
  }

  const transactions = (transactionsResult.data ?? []) as TransactionRow[]
  const fundingSources = (fundingSourcesResult.data ?? []) as FundingSourceFilterOption[]
  const categoryTags = (categoryTagsResult.data ?? []) as CategoryTagFilterOption[]
  const filterKey = buildFilterKey(filters)
  const hasActiveFilters = Boolean(filterKey)

  return (
    <main className="min-h-dvh bg-[#f7f7f4] px-4 py-6">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              返回首页
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">交易列表</h1>
            <p className="mt-2 text-sm text-muted-foreground">展示全部收入和支出，可按条件筛选并逐步加载。</p>
          </div>
          <Link className={buttonVariants()} href="/transactions/new">
            新增记账
          </Link>
        </header>

        <TransactionFilterDialog
          filters={filters}
          fundingSources={fundingSources}
          categoryTags={categoryTags}
        />

        {transactions.length > 0 ? (
          <TransactionsList
            key={filterKey}
            initialTransactions={transactions}
            initialHasMore={transactions.length === TRANSACTIONS_PAGE_SIZE}
            filters={filters}
          />
        ) : (
          <div className="rounded-3xl border bg-card p-8 text-center">
            <h2 className="text-xl font-semibold">{hasActiveFilters ? "没有符合条件的交易" : "还没有交易"}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {hasActiveFilters ? "调整筛选条件后再试。" : "先新增一笔收入或支出。"}
            </p>
            {hasActiveFilters ? (
              <Link className={buttonVariants({ variant: "outline", className: "mt-5" })} href="/transactions">
                清空筛选
              </Link>
            ) : (
              <Link className={buttonVariants({ className: "mt-5" })} href="/transactions/new">
                新增第一笔
              </Link>
            )}
          </div>
        )}
      </section>
    </main>
  )
}

function getTransactionsPage(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  ledgerId: string,
  filters: TransactionFilters
) {
  let query = supabase
    .from("transactions")
    .select("id,type,amount,transaction_date,note,funding_sources(name),category_tags(name)")
    .eq("ledger_id", ledgerId)
    .is("deleted_at", null)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })

  query = applyTransactionFilters(query, filters).range(0, TRANSACTIONS_PAGE_SIZE - 1)

  return query
}

function applyTransactionFilters<Query extends { eq: (column: string, value: string) => Query; gte: (column: string, value: string) => Query; lt: (column: string, value: string) => Query }>(
  query: Query,
  filters: TransactionFilters
) {
  let nextQuery = query

  if (filters.type) {
    nextQuery = nextQuery.eq("type", filters.type)
  }

  if (filters.fundingSourceId) {
    nextQuery = nextQuery.eq("funding_source_id", filters.fundingSourceId)
  }

  if (filters.categoryTagId) {
    nextQuery = nextQuery.eq("category_tag_id", filters.categoryTagId)
  }

  if (filters.year && filters.month) {
    const start = formatDate(new Date(filters.year, filters.month - 1, 1))
    const nextStart = formatDate(new Date(filters.year, filters.month, 1))

    nextQuery = nextQuery.gte("transaction_date", start).lt("transaction_date", nextStart)
  } else if (filters.year) {
    nextQuery = nextQuery.gte("transaction_date", `${filters.year}-01-01`).lt("transaction_date", `${filters.year + 1}-01-01`)
  }

  return nextQuery
}

function parseTransactionFilters(params: Awaited<SearchParams>): TransactionFilters {
  const year = readNumberParam(params.year)
  const month = readNumberParam(params.month)
  const type = readStringParam(params.type)
  const validYear = year && year >= 2000 && year <= 2100 ? year : undefined
  const validMonth = month && month >= 1 && month <= 12 ? month : undefined

  return {
    year: validYear ?? (validMonth ? new Date().getFullYear() : undefined),
    month: validMonth,
    type: type === "income" || type === "expense" ? type : undefined,
    fundingSourceId: readUuidLikeParam(params.fundingSourceId),
    categoryTagId: readUuidLikeParam(params.categoryTagId),
  }
}

function readStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function readNumberParam(value: string | string[] | undefined) {
  const rawValue = readStringParam(value)

  if (!rawValue) {
    return null
  }

  const numericValue = Number(rawValue)

  return Number.isInteger(numericValue) ? numericValue : null
}

function readUuidLikeParam(value: string | string[] | undefined) {
  const rawValue = readStringParam(value)

  if (!rawValue || !/^[0-9a-f-]{32,36}$/i.test(rawValue)) {
    return undefined
  }

  return rawValue
}

function buildFilterKey(filters: TransactionFilters) {
  return [
    filters.year ?? "",
    filters.month ?? "",
    filters.type ?? "",
    filters.fundingSourceId ?? "",
    filters.categoryTagId ?? "",
  ].join(":")
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}
