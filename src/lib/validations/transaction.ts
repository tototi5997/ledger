import { z } from "zod"

export const transactionTypeSchema = z.enum(["expense", "income"], {
  error: "请选择交易类型",
})

export const transactionFormSchema = z.object({
  type: transactionTypeSchema,
  fundingSourceId: z.string().uuid("请选择资金渠道"),
  amount: z
    .string()
    .trim()
    .min(1, "请输入金额")
    .regex(/^\d+(\.\d{1,2})?$/, "金额最多保留两位小数")
    .refine((value) => Number(value) > 0, "金额必须大于 0"),
  categoryTagId: z.string().uuid("请选择分类标签"),
  transactionDate: z.string().min(1, "请选择交易日期"),
  note: z.string().trim().max(200, "备注最多 200 个字").optional(),
})

export type TransactionFormInput = z.infer<typeof transactionFormSchema>
