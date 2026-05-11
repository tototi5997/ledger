import { z } from "zod"

export const fundingSourceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "请输入资金渠道名称")
    .max(20, "资金渠道名称最多 20 个字"),
})

export const fundingSourceIdSchema = z.string().uuid("资金渠道不存在")
