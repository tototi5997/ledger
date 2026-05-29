"use client"

import Link from "next/link"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"

import {
  resetPasswordAction,
  type ResetPasswordActionState,
} from "@/app/reset-password/actions"
import { Button } from "@/components/ui/button"

const initialState: ResetPasswordActionState = {
  message: "",
  status: "idle",
}

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(resetPasswordAction, initialState)

  return (
    <div className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-sm">
      <div className="mb-8 space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Ledger</p>
        <h1 className="text-3xl font-semibold tracking-tight">设置新密码</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          新密码至少 8 位，并且需要同时包含字母和数字。
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium">新密码</span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="至少 8 位，包含字母和数字"
            className="h-11 w-full rounded-xl border bg-background px-3 text-base outline-none transition focus:border-foreground"
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium">确认新密码</span>
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="再次输入新密码"
            className="h-11 w-full rounded-xl border bg-background px-3 text-base outline-none transition focus:border-foreground"
            required
          />
        </label>

        {state.message ? (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.message}
          </p>
        ) : null}

        <SubmitButton />
      </form>

      <div className="mt-6 border-t pt-5 text-center text-sm">
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          返回登录
        </Link>
      </div>
    </div>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="h-11 w-full rounded-xl" disabled={pending}>
      {pending ? "保存中..." : "保存新密码"}
    </Button>
  )
}
