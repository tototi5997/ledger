export type TransactionRow = {
  id: string
  type: "expense" | "income"
  amount: string
  transaction_date: string
  note: string | null
  funding_sources: {
    name: string
  } | null
  category_tags: {
    name: string
  } | null
}
