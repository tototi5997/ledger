"use client"

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { AssetTrendPoint } from "@/lib/assets/summary"

const moneyFormatter = new Intl.NumberFormat("zh-CN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function AssetsTrendChart({ data }: { data: AssetTrendPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} tickFormatter={formatCompactMoney} />
          <Tooltip formatter={formatTooltipValue} labelFormatter={formatTooltipLabel} />
          <Line type="monotone" dataKey="balance" name="总资产" stroke="#26251e" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function formatCompactMoney(value: number) {
  if (Math.abs(value) >= 10000) {
    return `${moneyFormatter.format(value / 10000)}万`
  }

  return moneyFormatter.format(value)
}

function formatTooltipValue(value: unknown) {
  const numericValue = typeof value === "number" ? value : Number(value)

  if (!Number.isFinite(numericValue)) {
    return "¥0.00"
  }

  return `¥${moneyFormatter.format(numericValue)}`
}

function formatTooltipLabel(_label: unknown, payload: unknown) {
  const items = Array.isArray(payload) ? payload : []
  const firstItem = items[0] as { payload?: AssetTrendPoint } | undefined

  return firstItem?.payload?.date ?? ""
}
