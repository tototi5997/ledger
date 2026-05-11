import Link from "next/link"

import { hideFundingSourceAction } from "@/app/settings/funding-sources/actions"
import {
  CreateFundingSourceForm,
  DeleteFundingSourceForm,
  UpdateFundingSourceForm,
} from "@/app/settings/funding-sources/funding-source-forms"
import { Button } from "@/components/ui/button"
import { getCurrentUserOrRedirect, getDefaultLedgerId } from "@/lib/ledger/queries"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function FundingSourcesPage() {
  const supabase = await createSupabaseServerClient()
  const user = await getCurrentUserOrRedirect(supabase)
  const ledgerId = await getDefaultLedgerId(supabase, user)
  const { data, error } = await supabase
    .from("funding_sources")
    .select("id,name,hidden_at")
    .eq("ledger_id", ledgerId)
    .order("created_at", { ascending: true })

  if (error) {
    throw error
  }

  const sources = data ?? []

  return (
    <main className="min-h-dvh bg-[#f7f7f4] px-4 py-6">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header>
          <Link href="/settings" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            返回设置
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">资金渠道</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            管理收入和支出的资金来源。隐藏后不会出现在新增记账选项中，历史交易仍会保留名称。
          </p>
        </header>

        <CreateFundingSourceForm />

        <div className="overflow-hidden rounded-3xl border bg-card">
          {sources.length > 0 ? (
            sources.map((source) => (
              <article key={source.id} className="space-y-4 border-b p-5 last:border-b-0">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{source.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {source.hidden_at ? "已隐藏" : "使用中"}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    {!source.hidden_at ? (
                      <form action={hideFundingSourceAction}>
                        <input type="hidden" name="id" value={source.id} />
                        <Button type="submit" variant="outline" size="sm">
                          隐藏
                        </Button>
                      </form>
                    ) : null}
                    <DeleteFundingSourceForm id={source.id} name={source.name} />
                  </div>
                </div>
                <UpdateFundingSourceForm id={source.id} name={source.name} />
              </article>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              暂无资金渠道。
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
