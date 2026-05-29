import { z } from "zod"

import { fundingSourceIdSchema } from "@/lib/validations/funding-source"

const amountPattern = /^\d+(\.\d{1,2})?$/

function getTodayDate() {
  return new Date().toISOString().slice(0, 10)
}

export const balanceSnapshotFormSchema = z.object({
  fundingSourceId: fundingSourceIdSchema,
  balanceAmount: z
    .string()
    .trim()
    .min(1, "请输入余额")
    .regex(amountPattern, "余额最多保留两位小数")
    .refine((value) => Number(value) >= 0, "余额不能小于 0")
    .refine((value) => Number(value) <= 9999999999.99, "余额不能超过 9999999999.99"),
  snapshotDate: z
    .string()
    .min(1, "请选择快照日期")
    .refine((value) => value <= getTodayDate(), "不能设置未来日期"),
  note: z.string().trim().max(200, "备注最多 200 个字").optional(),
})

export type BalanceSnapshotFormInput = z.infer<typeof balanceSnapshotFormSchema>
