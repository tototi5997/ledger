"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"

import {
  saveBalanceSnapshotAction,
  type BalanceSnapshotActionState,
} from "@/app/assets/actions"
import { Button } from "@/components/ui/button"

type FundingSourceOption = {
  id: string
  name: string
  hidden_at: string | null
}

const initialState: BalanceSnapshotActionState = {
  message: "",
}

export function BalanceSnapshotForm({
  fundingSources,
}: {
  fundingSources: FundingSourceOption[]
}) {
  const [state, formAction] = useActionState(saveBalanceSnapshotAction, initialState)
  const [amount, setAmount] = useState("")

  return (
    <form action={formAction} className="rounded-3xl border bg-card p-5">
      <div>
        <h2 className="text-xl font-semibold">设置余额</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          余额用于资产总览，不会计入收入或支出统计。
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <label className="block space-y-2">
          <span className="text-sm font-medium">资金渠道</span>
          <select
            name="fundingSourceId"
            className="h-11 w-full rounded-2xl border bg-background px-3 text-base outline-none focus:border-foreground"
            required
          >
            <option value="">请选择资金渠道</option>
            {fundingSources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
                {source.hidden_at ? "（已隐藏）" : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium">快照日期</span>
          <input
            type="date"
            name="snapshotDate"
            defaultValue={getToday()}
            max={getToday()}
            className="h-11 w-full rounded-2xl border bg-background px-3 text-base outline-none focus:border-foreground"
            required
          />
        </label>
      </div>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-medium">余额</span>
        <input
          name="balanceAmount"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(formatAmountInput(event.target.value))}
          placeholder="0.00"
          className="h-14 w-full rounded-2xl border bg-background px-3 text-2xl font-semibold outline-none focus:border-foreground"
          required
        />
      </label>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-medium">备注</span>
        <textarea
          name="note"
          rows={2}
          placeholder="可选，例如：手动对账"
          className="w-full resize-none rounded-2xl border bg-background px-3 py-3 text-base outline-none focus:border-foreground"
        />
      </label>

      {state.message ? (
        <p className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="mt-5 w-full sm:w-auto" disabled={pending}>
      {pending ? "保存中..." : "保存余额"}
    </Button>
  )
}

function getToday() {
  return new Date().toISOString().slice(0, 10)
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
