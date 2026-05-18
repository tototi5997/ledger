export default function CategoryTagsLoading() {
  return (
    <main className="min-h-dvh bg-[#f7f7f4] px-4 py-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">分类标签管理页加载中</span>
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header>
          <Skeleton className="h-4 w-20" />
          <Skeleton className="mt-3 h-9 w-32" />
          <Skeleton className="mt-3 h-4 w-full max-w-lg" />
          <Skeleton className="mt-2 h-4 w-2/3" />
        </header>

        <div className="grid grid-cols-2 rounded-3xl border bg-card p-1">
          <Skeleton className="h-11 rounded-2xl" />
          <Skeleton className="h-11 rounded-2xl bg-transparent" />
        </div>

        <FormSkeleton />

        <section className="overflow-hidden rounded-3xl border bg-card">
          <div className="border-b px-5 py-4">
            <Skeleton className="h-5 w-24" />
          </div>
          <ManageItemSkeleton />
          <ManageItemSkeleton />
          <ManageItemSkeleton />
          <ManageItemSkeleton />
        </section>
      </section>
    </main>
  )
}

function FormSkeleton() {
  return (
    <div className="rounded-3xl border bg-card p-5">
      <Skeleton className="h-5 w-28" />
      <div className="mt-4 flex gap-3">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-20 rounded-lg" />
      </div>
    </div>
  )
}

function ManageItemSkeleton() {
  return (
    <article className="space-y-4 border-b p-5 last:border-b-0">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-14" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-7 w-12 rounded-lg" />
          <Skeleton className="h-7 w-12 rounded-lg" />
        </div>
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-20 rounded-lg" />
      </div>
    </article>
  )
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-[#e6e5e0] ${className}`} />
}
