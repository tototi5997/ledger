"use client"

import Link from "next/link"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"

import {
  forgotPasswordAction,
  type ForgotPasswordActionState,
} from "@/app/forgot-password/actions"
import { Button } from "@/components/ui/button"

const initialState: ForgotPasswordActionState = {
  message: "",
  status: "idle",
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, initialState)

  return (
    <div className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-sm">
      <div className="mb-8 space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Ledger</p>
        <h1 className="text-3xl font-semibold tracking-tight">找回密码</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          输入注册邮箱，我们会发送一封用于重新设置密码的邮件。
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium">邮箱</span>
          <input
            name="email"
            type="email"
            autoComplete="username"
            placeholder="you@example.com"
            className="h-11 w-full rounded-xl border bg-background px-3 text-base outline-none transition focus:border-foreground"
            required
          />
        </label>

        {state.message ? (
          <p className={getMessageClassName(state.status)}>
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
      {pending ? "发送中..." : "发送重设邮件"}
    </Button>
  )
}

function getMessageClassName(status?: ForgotPasswordActionState["status"]) {
  if (status === "success") {
    return "rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
  }

  return "rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
}
