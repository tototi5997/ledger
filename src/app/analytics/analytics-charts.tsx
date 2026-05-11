"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type RankingDatum = {
  name: string
  income: number
  expense: number
}

type DailyDatum = {
  day: string
  income: number
  expense: number
  balance: number
}

const moneyFormatter = new Intl.NumberFormat("zh-CN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function FundingSourceChart({ data }: { data: RankingDatum[] }) {
  return <StackedAmountChart data={data} />
}

export function CategorySummaryChart({ data }: { data: RankingDatum[] }) {
  return <StackedAmountChart data={data} />
}

export function DailyTrendChart({ data }: { data: DailyDatum[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} tickFormatter={formatCompactMoney} />
          <Tooltip formatter={formatTooltipValue} labelFormatter={(label) => `${label} 日`} />
          <Legend />
          <Line type="monotone" dataKey="income" name="收入" stroke="#1f8a65" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="expense" name="支出" stroke="#cf2d56" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="balance" name="结余" stroke="#26251e" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function StackedAmountChart({ data }: { data: RankingDatum[] }) {
  const hasIncome = data.some((item) => item.income > 0)
  const hasExpense = data.some((item) => item.expense > 0)

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} tickFormatter={formatCompactMoney} />
          <Tooltip formatter={formatTooltipValue} />
          <Legend />
          {hasIncome ? <Bar dataKey="income" name="收入" fill="#1f8a65" radius={[6, 6, 0, 0]} /> : null}
          {hasExpense ? <Bar dataKey="expense" name="支出" fill="#cf2d56" radius={[6, 6, 0, 0]} /> : null}
        </BarChart>
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
