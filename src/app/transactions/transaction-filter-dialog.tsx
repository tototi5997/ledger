"use client"

import { useState } from "react"
import Link from "next/link"

import type { TransactionFilters } from "@/app/transactions/types"
import { Button, buttonVariants } from "@/components/ui/button"

export type FundingSourceFilterOption = {
  id: string
  name: string
  hidden_at: string | null
}

export type CategoryTagFilterOption = {
  id: string
  name: string
  type: "expense" | "income"
  hidden_at: string | null
}

export function TransactionFilterDialog({
  filters,
  fundingSources,
  categoryTags,
}: {
  filters: TransactionFilters
  fundingSources: FundingSourceFilterOption[]
  categoryTags: CategoryTagFilterOption[]
}) {
  const [open, setOpen] = useState(false)
  const activeCount = countActiveFilters(filters)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border bg-card p-4">
      <div>
        <p className="font-medium">筛选交易</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {activeCount > 0 ? `已启用 ${activeCount} 个筛选条件` : "当前展示全部交易"}
        </p>
      </div>
      <div className="flex gap-3">
        {activeCount > 0 ? (
          <Link className={buttonVariants({ variant: "outline" })} href="/transactions">
            清空
          </Link>
        ) : null}
        <Button type="button" onClick={() => setOpen(true)}>
          筛选
        </Button>
      </div>
      {open ? (
        <TransactionFilterLayer
          filters={filters}
          fundingSources={fundingSources}
          categoryTags={categoryTags}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  )
}

function TransactionFilterLayer({
  filters,
  fundingSources,
  categoryTags,
  onClose,
}: {
  filters: TransactionFilters
  fundingSources: FundingSourceFilterOption[]
  categoryTags: CategoryTagFilterOption[]
  onClose: () => void
}) {
  const currentYear = new Date().getFullYear()
  const displayedCategoryTags = filters.type
    ? categoryTags.filter((tag) => tag.type === filters.type || tag.id === filters.categoryTagId)
    : categoryTags
  const years = Array.from(
    new Set([filters.year, ...Array.from({ length: 12 }, (_, index) => currentYear - 10 + index)].filter(Boolean))
  ).sort((left, right) => Number(left) - Number(right))
  const months = Array.from({ length: 12 }, (_, index) => index + 1)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 px-4 pb-4 sm:items-center sm:pb-0">
      <button
        type="button"
        aria-label="关闭筛选弹窗"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl rounded-3xl border bg-card p-5 shadow-xl sm:rounded-2xl">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted sm:hidden" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">筛选交易</h2>
            <p className="mt-1 text-sm text-muted-foreground">选择条件后刷新交易列表。</p>
          </div>
          <button
            type="button"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={onClose}
          >
            关闭
          </button>
        </div>

        <form action="/transactions" className="mt-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">年份</span>
              <select name="year" defaultValue={filters.year ?? ""} className="h-10 rounded-lg border bg-background px-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <option value="">全部年份</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">月份</span>
              <select name="month" defaultValue={filters.month ?? ""} className="h-10 rounded-lg border bg-background px-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <option value="">全部月份</option>
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month} 月
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">类型</span>
              <select name="type" defaultValue={filters.type ?? ""} className="h-10 rounded-lg border bg-background px-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <option value="">全部类型</option>
                <option value="income">收入</option>
                <option value="expense">支出</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">资金渠道</span>
              <select name="fundingSourceId" defaultValue={filters.fundingSourceId ?? ""} className="h-10 rounded-lg border bg-background px-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <option value="">全部渠道</option>
                {fundingSources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                    {source.hidden_at ? "（已隐藏）" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="text-muted-foreground">分类标签</span>
              <select name="categoryTagId" defaultValue={filters.categoryTagId ?? ""} className="h-10 rounded-lg border bg-background px-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <option value="">全部标签</option>
                {displayedCategoryTags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.type === "income" ? "收入" : "支出"} · {tag.name}
                    {tag.hidden_at ? "（已隐藏）" : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link className={buttonVariants({ variant: "outline" })} href="/transactions">
              清空
            </Link>
            <Button type="submit">应用筛选</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function countActiveFilters(filters: TransactionFilters) {
  return [
    filters.year,
    filters.month,
    filters.type,
    filters.fundingSourceId,
    filters.categoryTagId,
  ].filter(Boolean).length
}
