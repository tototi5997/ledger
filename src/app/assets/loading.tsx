export default function AssetsLoading() {
  return (
    <main className="min-h-dvh bg-[#f7f7f4] px-4 py-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">资产页加载中</span>
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-3 h-9 w-28" />
            <Skeleton className="mt-3 h-4 w-80 max-w-[70vw]" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <SummarySkeleton />
          <SummarySkeleton />
          <SummarySkeleton />
        </div>

        <section className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="space-y-6">
            <section className="rounded-3xl border bg-card p-5">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="mt-2 h-4 w-52" />
              <div className="mt-5 flex h-60 items-end gap-3">
                <Skeleton className="h-24 flex-1 rounded-t-lg" />
                <Skeleton className="h-36 flex-1 rounded-t-lg" />
                <Skeleton className="h-32 flex-1 rounded-t-lg" />
                <Skeleton className="h-44 flex-1 rounded-t-lg" />
                <Skeleton className="h-40 flex-1 rounded-t-lg" />
                <Skeleton className="h-52 flex-1 rounded-t-lg" />
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl border bg-card">
              <div className="border-b px-5 py-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="mt-2 h-4 w-64 max-w-[70vw]" />
              </div>
              <ChannelSkeleton />
              <ChannelSkeleton />
              <ChannelSkeleton />
            </section>
          </div>

          <aside className="rounded-3xl border bg-card p-5">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="mt-2 h-4 w-52" />
            <Skeleton className="mt-5 h-11 w-full rounded-lg" />
            <Skeleton className="mt-4 h-11 w-full rounded-lg" />
            <Skeleton className="mt-4 h-14 w-full rounded-lg" />
            <Skeleton className="mt-4 h-20 w-full rounded-lg" />
            <Skeleton className="mt-5 h-8 w-24 rounded-lg" />
          </aside>
        </section>
      </section>
    </main>
  )
}

function SummarySkeleton() {
  return (
    <div className="rounded-3xl border bg-card p-5">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="mt-4 h-7 w-32" />
    </div>
  )
}

function ChannelSkeleton() {
  return (
    <article className="grid gap-3 border-b p-5 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <Skeleton className="h-5 w-28" />
        <Skeleton className="mt-2 h-3 w-32" />
      </div>
      <div className="space-y-2 sm:text-right">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-3 w-24" />
      </div>
    </article>
  )
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-[#e6e5e0] ${className}`} />
}
