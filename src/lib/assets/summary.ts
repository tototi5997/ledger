export type AssetFundingSource = {
  id: string
  name: string
  hidden_at: string | null
}

export type AssetSnapshot = {
  id: string
  funding_source_id: string
  balance_amount: string
  snapshot_date: string
  note: string | null
  created_at: string
  updated_at: string
}

export type AssetTransaction = {
  type: "expense" | "income"
  amount: string
  funding_source_id: string
  transaction_date: string
}

export type AssetChannelBalance = {
  id: string
  name: string
  hiddenAt: string | null
  currentBalance: number | null
  monthChange: number | null
  monthlyTransactionNet: number
  latestSnapshotAmount: number | null
  latestSnapshotDate: string | null
  latestSnapshotNote: string | null
}

export type AssetTrendPoint = {
  date: string
  label: string
  balance: number
  configuredCount: number
}

export type AssetSummary = {
  totalBalance: number
  monthChange: number | null
  configuredCount: number
  totalSources: number
  lastSnapshotDate: string | null
  hasAnySnapshot: boolean
  channels: AssetChannelBalance[]
  trend: AssetTrendPoint[]
}

export function buildAssetSummary({
  sources,
  snapshots,
  transactions,
  today = getTodayDate(),
  trendDays = 30,
}: {
  sources: AssetFundingSource[]
  snapshots: AssetSnapshot[]
  transactions: AssetTransaction[]
  today?: string
  trendDays?: number
}): AssetSummary {
  const snapshotsBySource = groupBy(snapshots, (snapshot) => snapshot.funding_source_id)
  const transactionsBySource = groupBy(transactions, (transaction) => transaction.funding_source_id)
  const monthStart = getMonthStartDate(today)
  const monthBaselineDate = addDays(monthStart, -1)
  const channels = sources.map((source) => {
    const sourceSnapshots = sortByDate(snapshotsBySource.get(source.id) ?? [], "snapshot_date")
    const sourceTransactions = sortByDate(transactionsBySource.get(source.id) ?? [], "transaction_date")
    const currentBalance = calculateBalanceAtDate(sourceSnapshots, sourceTransactions, today)
    const monthBaseline = calculateBalanceAtDate(sourceSnapshots, sourceTransactions, monthBaselineDate)
    const latestSnapshot = findLatestSnapshot(sourceSnapshots, today)
    const monthlyTransactionNet = sourceTransactions.reduce((total, transaction) => {
      if (transaction.transaction_date < monthStart || transaction.transaction_date > today) {
        return total
      }

      return total + getSignedAmount(transaction)
    }, 0)

    return {
      id: source.id,
      name: source.name,
      hiddenAt: source.hidden_at,
      currentBalance,
      monthChange:
        currentBalance === null || monthBaseline === null
          ? null
          : roundCurrency(currentBalance - monthBaseline),
      monthlyTransactionNet: roundCurrency(monthlyTransactionNet),
      latestSnapshotAmount: latestSnapshot ? Number(latestSnapshot.balance_amount) : null,
      latestSnapshotDate: latestSnapshot?.snapshot_date ?? null,
      latestSnapshotNote: latestSnapshot?.note ?? null,
    }
  })
  const totalBalance = roundCurrency(
    channels.reduce((total, channel) => total + (channel.currentBalance ?? 0), 0)
  )
  const configuredCount = channels.filter((channel) => channel.currentBalance !== null).length
  const currentTotal = calculateTotalAtDate(sources, snapshotsBySource, transactionsBySource, today)
  const baselineTotal = calculateTotalAtDate(sources, snapshotsBySource, transactionsBySource, monthBaselineDate)
  const trend = buildTrendPoints({
    sources,
    snapshotsBySource,
    transactionsBySource,
    today,
    trendDays,
  })
  const lastSnapshotDate =
    snapshots.length > 0
      ? snapshots.reduce((latest, snapshot) =>
          !latest || snapshot.snapshot_date > latest ? snapshot.snapshot_date : latest,
        "")
      : null

  return {
    totalBalance,
    monthChange:
      baselineTotal.configuredCount === 0 || baselineTotal.configuredCount !== currentTotal.configuredCount
        ? null
        : roundCurrency(currentTotal.balance - baselineTotal.balance),
    configuredCount,
    totalSources: sources.length,
    lastSnapshotDate,
    hasAnySnapshot: snapshots.length > 0,
    channels: channels.sort(compareChannels),
    trend,
  }
}

function calculateTotalAtDate(
  sources: AssetFundingSource[],
  snapshotsBySource: Map<string, AssetSnapshot[]>,
  transactionsBySource: Map<string, AssetTransaction[]>,
  targetDate: string
) {
  let balance = 0
  let configuredCount = 0

  for (const source of sources) {
    const sourceSnapshots = sortByDate(snapshotsBySource.get(source.id) ?? [], "snapshot_date")
    const sourceTransactions = sortByDate(transactionsBySource.get(source.id) ?? [], "transaction_date")
    const sourceBalance = calculateBalanceAtDate(sourceSnapshots, sourceTransactions, targetDate)

    if (sourceBalance !== null) {
      configuredCount += 1
      balance += sourceBalance
    }
  }

  return {
    balance: roundCurrency(balance),
    configuredCount,
  }
}

function calculateBalanceAtDate(
  snapshots: AssetSnapshot[],
  transactions: AssetTransaction[],
  targetDate: string
) {
  const latestSnapshot = findLatestSnapshot(snapshots, targetDate)

  if (!latestSnapshot) {
    return null
  }

  const transactionNet = transactions.reduce((total, transaction) => {
    if (
      transaction.transaction_date <= latestSnapshot.snapshot_date ||
      transaction.transaction_date > targetDate
    ) {
      return total
    }

    return total + getSignedAmount(transaction)
  }, 0)

  return roundCurrency(Number(latestSnapshot.balance_amount) + transactionNet)
}

function findLatestSnapshot(snapshots: AssetSnapshot[], targetDate: string) {
  let latest: AssetSnapshot | null = null

  for (const snapshot of snapshots) {
    if (snapshot.snapshot_date <= targetDate) {
      latest = snapshot
    } else {
      break
    }
  }

  return latest
}

function buildTrendPoints({
  sources,
  snapshotsBySource,
  transactionsBySource,
  today,
  trendDays,
}: {
  sources: AssetFundingSource[]
  snapshotsBySource: Map<string, AssetSnapshot[]>
  transactionsBySource: Map<string, AssetTransaction[]>
  today: string
  trendDays: number
}) {
  return Array.from({ length: trendDays }, (_, index) => {
    const date = addDays(today, index - trendDays + 1)
    const total = calculateTotalAtDate(sources, snapshotsBySource, transactionsBySource, date)

    return {
      date,
      label: `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`,
      balance: total.balance,
      configuredCount: total.configuredCount,
    }
  })
}

function getSignedAmount(transaction: AssetTransaction) {
  const amount = Number(transaction.amount)

  return transaction.type === "income" ? amount : -amount
}

function compareChannels(left: AssetChannelBalance, right: AssetChannelBalance) {
  if (left.currentBalance === null && right.currentBalance !== null) {
    return 1
  }

  if (left.currentBalance !== null && right.currentBalance === null) {
    return -1
  }

  return (right.currentBalance ?? 0) - (left.currentBalance ?? 0)
}

function groupBy<Item>(items: Item[], getKey: (item: Item) => string) {
  const result = new Map<string, Item[]>()

  for (const item of items) {
    const key = getKey(item)
    const list = result.get(key) ?? []
    list.push(item)
    result.set(key, list)
  }

  return result
}

function sortByDate<Item extends Record<Key, string>, Key extends keyof Item>(
  items: Item[],
  key: Key
) {
  return [...items].sort((left, right) => left[key].localeCompare(right[key]))
}

function getTodayDate() {
  return formatDate(new Date())
}

function getMonthStartDate(date: string) {
  return `${date.slice(0, 7)}-01`
}

function addDays(date: string, days: number) {
  const parsed = parseDate(date)
  parsed.setDate(parsed.getDate() + days)

  return formatDate(parsed)
}

function parseDate(date: string) {
  const [year, month, day] = date.split("-").map(Number)

  return new Date(year, month - 1, day)
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
