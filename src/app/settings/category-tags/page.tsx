import Link from "next/link"

import { CategoryTagsManager } from "@/app/settings/category-tags/category-tags-manager"
import { getCurrentUserOrRedirect, getDefaultLedgerId } from "@/lib/ledger/queries"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type CategoryTag = {
  id: string
  name: string
  type: "expense" | "income"
  hidden_at: string | null
}

export default async function CategoryTagsPage() {
  const supabase = await createSupabaseServerClient()
  const user = await getCurrentUserOrRedirect(supabase)
  const ledgerId = await getDefaultLedgerId(supabase, user)
  const { data, error } = await supabase
    .from("category_tags")
    .select("id,name,type,hidden_at")
    .eq("ledger_id", ledgerId)
    .order("type", { ascending: true })
    .order("created_at", { ascending: true })

  if (error) {
    throw error
  }

  const tags = (data ?? []) as CategoryTag[]

  return (
    <main className="min-h-dvh bg-[#f7f7f4] px-4 py-6">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header>
          <Link href="/settings" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            返回设置
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">分类标签</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            管理收入和支出的分类。删除已使用标签时，相关交易会迁移到同类型“其他”标签。
          </p>
        </header>

        <CategoryTagsManager tags={tags} />
      </section>
    </main>
  )
}
