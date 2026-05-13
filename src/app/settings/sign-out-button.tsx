"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"

import { signOutAction, type AuthActionState } from "@/app/login/actions"
import { Button } from "@/components/ui/button"

const initialState: AuthActionState = {
  message: "",
}

export function SignOutButton() {
  const [state, formAction] = useActionState(signOutAction, initialState)
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-3xl border bg-card p-5">
      <p className="font-medium">登录状态</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        退出后需要重新登录才能继续记账。
      </p>
      <Button
        type="button"
        variant="destructive"
        className="mt-4 h-10"
        onClick={() => setOpen(true)}
      >
        退出登录
      </Button>
      {state.message ? (
        <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      {open ? <ConfirmSignOutLayer action={formAction} onClose={() => setOpen(false)} /> : null}
    </div>
  )
}

function ConfirmSignOutLayer({
  action,
  onClose,
}: {
  action: (formData: FormData) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 px-4 pb-4 sm:items-center sm:pb-0">
      <button
        type="button"
        aria-label="关闭确认框"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-3xl border bg-card p-5 shadow-xl sm:rounded-2xl">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted sm:hidden" />
        <h2 className="text-lg font-semibold">确认退出登录？</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          退出后需要重新登录才能继续记账。
        </p>
        <form action={action} className="mt-5 grid grid-cols-2 gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <ConfirmSignOutButton />
        </form>
      </div>
    </div>
  )
}

function ConfirmSignOutButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? "退出中..." : "退出"}
    </Button>
  )
}
