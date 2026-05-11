"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"

import {
  createCategoryTagAction,
  deleteCategoryTagAction,
  type CategoryTagActionState,
  updateCategoryTagAction,
} from "@/app/settings/category-tags/actions"
import { Button } from "@/components/ui/button"

const initialState: CategoryTagActionState = {
  message: "",
}

export function CreateCategoryTagForm() {
  const [state, formAction] = useActionState(createCategoryTagAction, initialState)

  return (
    <form action={formAction} className="rounded-3xl border bg-card p-5">
      <h2 className="text-lg font-semibold">新增分类标签</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_120px_auto]">
        <input
          name="name"
          placeholder="例如：咖啡"
          className="h-11 min-w-0 rounded-2xl border bg-background px-3 text-base outline-none focus:border-foreground"
          required
        />
        <select
          name="type"
          defaultValue="expense"
          className="h-11 rounded-2xl border bg-background px-3 text-base outline-none focus:border-foreground"
        >
          <option value="expense">支出</option>
          <option value="income">收入</option>
        </select>
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

export function CreateCategoryTagForTypeForm({ type }: { type: "expense" | "income" }) {
  const [state, formAction] = useActionState(createCategoryTagAction, initialState)

  return (
    <form action={formAction} className="rounded-3xl border bg-card p-5">
      <h2 className="text-lg font-semibold">新增{type === "income" ? "收入" : "支出"}标签</h2>
      <input type="hidden" name="type" value={type} />
      <div className="mt-4 flex gap-3">
        <input
          name="name"
          placeholder={type === "income" ? "例如：稿费" : "例如：咖啡"}
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

export function UpdateCategoryTagForm({
  id,
  name,
  type,
}: {
  id: string
  name: string
  type: "expense" | "income"
}) {
  const [state, formAction] = useActionState(updateCategoryTagAction, initialState)

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-3 sm:grid-cols-[1fr_110px_auto]">
        <input
          name="name"
          defaultValue={name}
          className="h-10 min-w-0 rounded-xl border bg-background px-3 text-sm outline-none focus:border-foreground"
          required
        />
        <select
          name="type"
          defaultValue={type}
          className="h-10 rounded-xl border bg-background px-3 text-sm outline-none focus:border-foreground"
        >
          <option value="expense">支出</option>
          <option value="income">收入</option>
        </select>
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

export function DeleteCategoryTagForm({
  id,
  name,
  type,
}: {
  id: string
  name: string
  type: "expense" | "income"
}) {
  const [state, formAction] = useActionState(deleteCategoryTagAction, initialState)
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
          type={type}
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
  type,
  onClose,
}: {
  action: (formData: FormData) => void
  id: string
  name: string
  type: "expense" | "income"
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
        <h2 className="text-lg font-semibold">确认删除分类标签？</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          将删除“{name}”。使用该标签的{type === "income" ? "收入" : "支出"}交易会自动迁移到同类型“其他”标签。
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

function SubmitButton({
  label,
  size = "default",
}: {
  label: string
  size?: "default" | "sm"
}) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" size={size} disabled={pending}>
      {pending ? "处理中..." : label}
    </Button>
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
