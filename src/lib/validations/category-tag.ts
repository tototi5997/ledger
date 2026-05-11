import { z } from "zod"

export const categoryTagTypeSchema = z.enum(["expense", "income"], {
  error: "请选择标签类型",
})

export const categoryTagSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "请输入分类标签名称")
    .max(20, "分类标签名称最多 20 个字"),
  type: categoryTagTypeSchema,
})

export const categoryTagIdSchema = z.string().uuid("分类标签不存在")
