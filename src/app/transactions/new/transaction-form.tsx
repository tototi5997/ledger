"use client"

import { useActionState, useMemo, useState } from "react"
import { useFormStatus } from "react-dom"

import {
  createTransactionAction,
  deleteTransactionAction,
  type TransactionActionState,
  updateTransactionAction,
} from "@/app/transactions/actions"
import { Button } from "@/components/ui/button"

type FundingSourceOption = {
  id: string
  name: string
}

type CategoryTagOption = {
  id: string
  name: string
  type: "expense" | "income"
}

const initialState: TransactionActionState = {
  message: "",
}

type TransactionFormMode = "create" | "edit"

type TransactionFormValue = {
  id?: string
  type: "expense" | "income"
  amount: string
  fundingSourceId: string
  categoryTagId: string
  transactionDate: string
  note: string
}

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

export function TransactionForm({
  fundingSources,
  categoryTags,
  mode = "create",
  initialValue,
}: {
  fundingSources: FundingSourceOption[]
  categoryTags: CategoryTagOption[]
  mode?: TransactionFormMode
  initialValue?: TransactionFormValue
}) {
  const action = mode === "edit" ? updateTransactionAction : createTransactionAction
  const [state, formAction] = useActionState(action, initialState)
  const [type, setType] = useState<"expense" | "income">(initialValue?.type ?? "expense")
  const [amount, setAmount] = useState(initialValue?.amount ?? "")
  const [categoryTagId, setCategoryTagId] = useState(initialValue?.categoryTagId ?? "")
  const filteredTags = useMemo(
    () => categoryTags.filter((tag) => tag.type === type),
    [categoryTags, type]
  )

  return (
    <form action={formAction} className="space-y-6 rounded-3xl border bg-card p-5">
      {initialValue?.id ? <input type="hidden" name="id" value={initialValue.id} /> : null}
      <section className="space-y-3">
        <p className="text-sm font-medium">1. 选择类型</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="cursor-pointer">
            <input
              type="radio"
              name="type"
              value="expense"
              checked={type === "expense"}
              onChange={() => {
                setType("expense")
                setCategoryTagId("")
              }}
              className="peer sr-only"
            />
            <span className="flex h-12 items-center justify-center rounded-2xl border bg-background text-sm font-medium peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground">
              支出
            </span>
          </label>
          <label className="cursor-pointer">
            <input
              type="radio"
              name="type"
              value="income"
              checked={type === "income"}
              onChange={() => {
                setType("income")
                setCategoryTagId("")
              }}
              className="peer sr-only"
            />
            <span className="flex h-12 items-center justify-center rounded-2xl border bg-background text-sm font-medium peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground">
              收入
            </span>
          </label>
        </div>
      </section>

      <label className="block space-y-2">
        <span className="text-sm font-medium">2. 资金渠道</span>
        <select
          name="fundingSourceId"
          defaultValue={initialValue?.fundingSourceId ?? ""}
          className="h-12 w-full rounded-2xl border bg-background px-3 text-base outline-none focus:border-foreground"
          required
        >
          <option value="">请选择资金渠道</option>
          {fundingSources.map((source) => (
            <option key={source.id} value={source.id}>
              {source.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">3. 金额</span>
        <input
          name="amount"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(formatAmountInput(event.target.value))}
          placeholder="0.00"
          className="h-14 w-full rounded-2xl border bg-background px-3 text-2xl font-semibold outline-none focus:border-foreground"
          required
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">4. 分类标签</span>
        <select
          name="categoryTagId"
          value={categoryTagId}
          onChange={(event) => setCategoryTagId(event.target.value)}
          className="h-12 w-full rounded-2xl border bg-background px-3 text-base outline-none focus:border-foreground"
          required
        >
          <option value="">请选择分类标签</option>
          {filteredTags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">日期</span>
        <input
          name="transactionDate"
          type="date"
          defaultValue={initialValue?.transactionDate ?? getToday()}
          className="h-12 w-full rounded-2xl border bg-background px-3 text-base outline-none focus:border-foreground"
          required
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">备注</span>
        <textarea
          name="note"
          rows={3}
          placeholder="可选"
          defaultValue={initialValue?.note}
          className="w-full resize-none rounded-2xl border bg-background px-3 py-3 text-base outline-none focus:border-foreground"
        />
      </label>

      {state.message ? (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <SubmitButton label={mode === "edit" ? "保存修改" : "保存记账"} />
    </form>
  )
}

function formatAmountInput(value: string) {
  const numericValue = value.replace(/[^\d.]/g, "")
  const [integerPart, ...decimalParts] = numericValue.split(".")
  const decimalPart = decimalParts.join("").slice(0, 2)

  if (numericValue.includes(".")) {
    return `${integerPart}.${decimalPart}`
  }

  return integerPart
}

export function DeleteTransactionForm({
  id,
  compact = false,
}: {
  id: string
  compact?: boolean
}) {
  const [state, formAction] = useActionState(deleteTransactionAction, initialState)
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="destructive"
        size={compact ? "sm" : "default"}
        onClick={() => setOpen(true)}
      >
        删除
      </Button>
      {state.message ? (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      {open ? (
        <ConfirmDeleteLayer action={formAction} id={id} onClose={() => setOpen(false)} />
      ) : null}
    </div>
  )
}

function ConfirmDeleteLayer({
  action,
  id,
  onClose,
}: {
  action: (formData: FormData) => void
  id: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 px-4 pb-4 sm:items-center sm:pb-0">
      <button
        type="button"
        aria-label="关闭确认框"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-3xl border bg-card p-5 shadow-xl sm:rounded-2xl">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted sm:hidden" />
        <h2 className="text-lg font-semibold">确认删除交易？</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          删除后该交易不会再出现在列表和统计中。
        </p>
        <form action={action} className="mt-5 grid grid-cols-2 gap-3">
          <input type="hidden" name="id" value={id} />
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <ConfirmDeleteButton />
        </form>
      </div>
    </div>
  )
}

function ConfirmDeleteButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? "删除中..." : "确认删除"}
    </Button>
  )
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="h-12 w-full rounded-2xl" disabled={pending}>
      {pending ? "保存中..." : label}
    </Button>
  )
}
