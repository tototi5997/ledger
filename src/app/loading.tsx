export default function Loading() {
  return (
    <main className="min-h-dvh bg-[#f7f7f4] px-4 py-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">页面加载中</span>
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-4 w-64 max-w-[70vw]" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <SummarySkeleton />
          <SummarySkeleton />
          <SummarySkeleton />
        </div>

        <section className="rounded-3xl border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-44" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16 rounded-lg" />
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          </div>

          <div className="mt-5 divide-y">
            <ListRowSkeleton />
            <ListRowSkeleton />
            <ListRowSkeleton />
            <ListRowSkeleton />
            <ListRowSkeleton />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
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

function ListRowSkeleton() {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4 py-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-44 max-w-[52vw]" />
      </div>
      <Skeleton className="h-5 w-20" />
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="rounded-3xl border bg-card p-5">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="mt-2 h-4 w-40" />
      <div className="mt-5 flex h-44 items-end gap-3">
        <Skeleton className="h-20 flex-1 rounded-t-lg" />
        <Skeleton className="h-32 flex-1 rounded-t-lg" />
        <Skeleton className="h-24 flex-1 rounded-t-lg" />
        <Skeleton className="h-36 flex-1 rounded-t-lg" />
        <Skeleton className="h-28 flex-1 rounded-t-lg" />
      </div>
    </div>
  )
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-[#e6e5e0] ${className}`} />
}
