"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"

import { loginAction, registerAction, type AuthActionState } from "@/app/login/actions"
import { Button } from "@/components/ui/button"

const initialState: AuthActionState = {
  message: "",
}

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "register">("login")

  return (
    <div className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-sm">
      <div className="mb-8 space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Ledger</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {mode === "login" ? "登录你的账本" : "创建个人账本"}
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          使用邮箱和密码进入个人记账空间。
        </p>
      </div>

      {mode === "login" ? <LoginFields /> : <RegisterFields />}

      <div className="mt-6 border-t pt-5 text-center text-sm text-muted-foreground">
        {mode === "login" ? "还没有邮箱账号？" : "已经有邮箱账号？"}
        <button
          type="button"
          className="ml-2 font-medium text-foreground underline-offset-4 hover:underline"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "注册" : "登录"}
        </button>
      </div>
    </div>
  )
}

function LoginFields() {
  const [state, formAction] = useActionState(loginAction, initialState)

  return (
    <AuthForm action={formAction} message={state.message} mode="login" />
  )
}

function RegisterFields() {
  const [state, formAction] = useActionState(registerAction, initialState)

  return (
    <AuthForm action={formAction} message={state.message} mode="register" />
  )
}

function AuthForm({
  action,
  message,
  mode,
}: {
  action: (formData: FormData) => void
  message: string
  mode: "login" | "register"
}) {
  return (
    <form action={action} className="space-y-4">
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

      <label className="block space-y-2">
        <span className="text-sm font-medium">密码</span>
        <input
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder="至少 8 位，包含字母和数字"
          className="h-11 w-full rounded-xl border bg-background px-3 text-base outline-none transition focus:border-foreground"
          required
        />
      </label>

      {mode === "register" ? (
        <label className="block space-y-2">
          <span className="text-sm font-medium">确认密码</span>
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="再次输入密码"
            className="h-11 w-full rounded-xl border bg-background px-3 text-base outline-none transition focus:border-foreground"
            required
          />
        </label>
      ) : null}

      {message ? (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {message}
        </p>
      ) : null}

      <SubmitButton mode={mode} />
    </form>
  )
}

function SubmitButton({ mode }: { mode: "login" | "register" }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="h-11 w-full rounded-xl" disabled={pending}>
      {pending ? "处理中..." : mode === "login" ? "登录" : "注册"}
    </Button>
  )
}
