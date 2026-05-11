"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"

import {
  createFundingSourceAction,
  deleteFundingSourceAction,
  type FundingSourceActionState,
  updateFundingSourceAction,
} from "@/app/settings/funding-sources/actions"
import { Button } from "@/components/ui/button"

const initialState: FundingSourceActionState = {
  message: "",
}

export function CreateFundingSourceForm() {
  const [state, formAction] = useActionState(createFundingSourceAction, initialState)

  return (
    <form action={formAction} className="rounded-3xl border bg-card p-5">
      <h2 className="text-lg font-semibold">新增资金渠道</h2>
      <div className="mt-4 flex gap-3">
        <input
          name="name"
          placeholder="例如：招商银行卡"
          className="h-11 min-w-0 flex-1 rounded-2xl border bg-background px-3 text-base outline-none focus:border-foreground"
          required
        />
        <SubmitButton label="新增" />
      </div>
      {state.message ? (
        <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
    </form>
  )
}

export function UpdateFundingSourceForm({
  id,
  name,
}: {
  id: string
  name: string
}) {
  const [state, formAction] = useActionState(updateFundingSourceAction, initialState)

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <div className="flex gap-3">
        <input
          name="name"
          defaultValue={name}
          className="h-10 min-w-0 flex-1 rounded-xl border bg-background px-3 text-sm outline-none focus:border-foreground"
          required
        />
        <SubmitButton label="保存" size="sm" />
      </div>
      {state.message ? (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
    </form>
  )
}

export function DeleteFundingSourceForm({
  id,
  name,
}: {
  id: string
  name: string
}) {
  const [state, formAction] = useActionState(deleteFundingSourceAction, initialState)
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-2">
      <Button type="button" variant="destructive" size="sm" onClick={() => setOpen(true)}>
        删除
      </Button>
      {state.message ? (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      {open ? (
        <ConfirmDeleteLayer
          action={formAction}
          id={id}
          name={name}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  )
}

function ConfirmDeleteLayer({
  action,
  id,
  name,
  onClose,
}: {
  action: (formData: FormData) => void
  id: string
  name: string
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
        <h2 className="text-lg font-semibold">确认删除资金渠道？</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          将删除“{name}”。如果该资金渠道已经被交易使用，系统会阻止删除，你可以改为隐藏。
        </p>
        <form action={action} className="mt-5 grid grid-cols-2 gap-3">
          <input type="hidden" name="id" value={id} />
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <ConfirmDeleteButton />
        </form>
      </div>
    </div>
  )
}

function ConfirmDeleteButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? "删除中..." : "确认删除"}
    </Button>
  )
}

function SubmitButton({
  label,
  size = "default",
  variant = "default",
}: {
  label: string
  size?: "default" | "sm"
  variant?: "default" | "destructive"
}) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" size={size} variant={variant} disabled={pending}>
      {pending ? "处理中..." : label}
    </Button>
  )
}
