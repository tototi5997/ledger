import Link from "next/link"

import { getCurrentUserOrRedirect, getDefaultLedgerId } from "@/lib/ledger/queries"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient()
  const user = await getCurrentUserOrRedirect(supabase)

  await getDefaultLedgerId(supabase, user)

  return (
    <main className="min-h-dvh bg-[#f7f7f4] px-4 py-6">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header>
          <Link href="/" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            返回首页
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">设置</h1>
        </header>

        <div className="overflow-hidden rounded-3xl border bg-card">
          <SettingsLink
            href="/settings/funding-sources"
            title="资金渠道"
            description="管理支付宝、微信、银行卡、现金等资金来源。"
          />
          <SettingsLink
            href="/settings/category-tags"
            title="分类标签"
            description="管理收入和支出的分类标签。"
          />
        </div>
      </section>
    </main>
  )
}

function SettingsLink({
  href,
  title,
  description,
}: {
  href: string
  title: string
  description: string
}) {
  return (
    <Link href={href} className="block border-b p-5 last:border-b-0 hover:bg-muted/50">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </Link>
  )
}
