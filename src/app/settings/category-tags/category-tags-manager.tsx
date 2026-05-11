"use client"

import { useState } from "react"

import { hideCategoryTagAction } from "@/app/settings/category-tags/actions"
import {
  CreateCategoryTagForTypeForm,
  DeleteCategoryTagForm,
  UpdateCategoryTagForm,
} from "@/app/settings/category-tags/category-tag-forms"
import { Button } from "@/components/ui/button"

type CategoryTag = {
  id: string
  name: string
  type: "expense" | "income"
  hidden_at: string | null
}

export function CategoryTagsManager({ tags }: { tags: CategoryTag[] }) {
  const [selectedType, setSelectedType] = useState<"income" | "expense">("income")
  const filteredTags = tags.filter((tag) => tag.type === selectedType)

  return (
    <>
      <div className="grid grid-cols-2 rounded-3xl border bg-card p-1">
        <button
          type="button"
          className={
            selectedType === "income"
              ? "h-11 rounded-2xl bg-primary text-sm font-medium text-primary-foreground"
              : "h-11 rounded-2xl text-sm font-medium text-muted-foreground"
          }
          onClick={() => setSelectedType("income")}
        >
          收入标签
        </button>
        <button
          type="button"
          className={
            selectedType === "expense"
              ? "h-11 rounded-2xl bg-primary text-sm font-medium text-primary-foreground"
              : "h-11 rounded-2xl text-sm font-medium text-muted-foreground"
          }
          onClick={() => setSelectedType("expense")}
        >
          支出标签
        </button>
      </div>

      <CreateCategoryTagForTypeForm type={selectedType} />

      <CategoryTagSection
        title={selectedType === "income" ? "收入标签" : "支出标签"}
        tags={filteredTags}
      />
    </>
  )
}

function CategoryTagSection({
  title,
  tags,
}: {
  title: string
  tags: CategoryTag[]
}) {
  return (
    <section className="overflow-hidden rounded-3xl border bg-card">
      <div className="border-b px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
      </div>
      {tags.length > 0 ? (
        tags.map((tag) => (
          <article key={tag.id} className="space-y-4 border-b p-5 last:border-b-0">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{tag.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tag.hidden_at ? "已隐藏" : "使用中"}
                </p>
              </div>
              <div className="flex items-start gap-2">
                {!tag.hidden_at ? (
                  <form action={hideCategoryTagAction}>
                    <input type="hidden" name="id" value={tag.id} />
                    <Button type="submit" variant="outline" size="sm">
                      隐藏
                    </Button>
                  </form>
                ) : null}
                <DeleteCategoryTagForm id={tag.id} name={tag.name} type={tag.type} />
              </div>
            </div>
            <UpdateCategoryTagForm id={tag.id} name={tag.name} type={tag.type} />
          </article>
        ))
      ) : (
        <div className="p-8 text-center text-sm text-muted-foreground">
          暂无标签。
        </div>
      )}
    </section>
  )
}
