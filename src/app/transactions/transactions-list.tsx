"use client"

import { useRef, useState, useTransition } from "react"
import Link from "next/link"

import { loadTransactionsPage } from "@/app/transactions/actions"
import { DeleteTransactionForm } from "@/app/transactions/new/transaction-form"
import type { TransactionFilters, TransactionRow } from "@/app/transactions/types"
import { Button } from "@/components/ui/button"

const ACTION_WIDTH = 144
const OPEN_THRESHOLD = 48

export function TransactionsList({
  initialTransactions,
  initialHasMore,
  filters,
}: {
  initialTransactions: TransactionRow[]
  initialHasMore: boolean
  filters: TransactionFilters
}) {
  const [transactions, setTransactions] = useState(initialTransactions)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()

  function loadMore() {
    setMessage("")
    startTransition(async () => {
      try {
        const result = await loadTransactionsPage(page, filters)
        setTransactions((current) => [...current, ...result.transactions])
        setHasMore(result.hasMore)
        setPage((current) => current + 1)
      } catch {
        setMessage("加载失败，请稍后重试")
      }
    })
  }

  if (transactions.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl border bg-card">
        {transactions.map((transaction) => (
          <SwipeTransactionItem key={transaction.id} transaction={transaction} />
        ))}
      </div>

      {message ? (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {message}
        </p>
      ) : null}

      {hasMore ? (
        <Button type="button" variant="outline" className="h-11 w-full rounded-2xl" onClick={loadMore} disabled={isPending}>
          {isPending ? "加载中..." : "加载更多"}
        </Button>
      ) : (
        <p className="text-center text-sm text-muted-foreground">已显示全部交易</p>
      )}
    </div>
  )
}

function SwipeTransactionItem({ transaction }: { transaction: TransactionRow }) {
  const startXRef = useRef(0)
  const startOffsetRef = useRef(0)
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)

  function handlePointerDown(event: React.PointerEvent<HTMLElement>) {
    startXRef.current = event.clientX
    startOffsetRef.current = offset
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    if (!dragging) {
      return
    }

    const delta = event.clientX - startXRef.current
    const nextOffset = Math.min(0, Math.max(-ACTION_WIDTH, startOffsetRef.current + delta))

    setOffset(nextOffset)
  }

  function handlePointerUp() {
    setDragging(false)
    setOffset(Math.abs(offset) > OPEN_THRESHOLD ? -ACTION_WIDTH : 0)
  }

  return (
    <article className="relative overflow-hidden border-b last:border-b-0">
      <div className="absolute inset-y-0 right-0 flex w-36">
        <Link
          href={`/transactions/${transaction.id}/edit`}
          className="flex w-18 items-center justify-center bg-muted text-sm font-medium text-foreground"
        >
          编辑
        </Link>
        <div className="flex w-18 items-center justify-center bg-destructive/10">
          <DeleteTransactionForm id={transaction.id} compact />
        </div>
      </div>
      <div
        role="button"
        tabIndex={0}
        className="relative flex touch-pan-y select-none items-center justify-between gap-4 bg-card px-5 py-4"
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? "none" : "transform 180ms ease",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOffset(0)
          }
        }}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              {transaction.type === "income" ? "收入" : "支出"}
            </span>
            <span className="text-sm font-medium">
              {transaction.category_tags?.name ?? "未命名标签"}
            </span>
            <span className="text-sm text-muted-foreground">
              {transaction.funding_sources?.name ?? "未知渠道"}
            </span>
          </div>
          <p className="mt-2 truncate text-sm text-muted-foreground">
            {transaction.transaction_date}
            {transaction.note ? ` · ${transaction.note}` : ""}
          </p>
        </div>
        <p
          className={
            transaction.type === "income"
              ? "shrink-0 text-lg font-semibold text-emerald-700"
              : "shrink-0 text-lg font-semibold text-foreground"
          }
        >
          {transaction.type === "income" ? "+" : "-"}
          {Number(transaction.amount).toFixed(2)}
        </p>
      </div>
    </article>
  )
}
