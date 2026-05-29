import { z } from "zod"

export const emailSchema = z.preprocess(
  (value) => (typeof value === "string" ? value : ""),
  z
    .string()
    .min(1, "请输入邮箱")
    .trim()
    .email("请输入有效的邮箱地址")
)

export const passwordSchema = z.preprocess(
  (value) => (typeof value === "string" ? value : ""),
  z
    .string()
    .min(1, "请输入密码")
    .trim()
    .min(8, "密码至少需要 8 位")
    .regex(/[A-Za-z]/, "密码至少需要包含一个字母")
    .regex(/\d/, "密码至少需要包含一个数字")
)

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const registerSchema = loginSchema
  .extend({
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  })

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  })

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}
