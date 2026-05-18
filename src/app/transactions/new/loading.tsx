export default function NewTransactionLoading() {
  return (
    <main className="min-h-dvh bg-[#f7f7f4] px-4 py-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">新增记账页加载中</span>
      <section className="mx-auto w-full max-w-xl">
        <Skeleton className="h-4 w-20" />

        <div className="mt-5 mb-6 space-y-3">
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-4 w-56 max-w-[70vw]" />
        </div>

        <div className="space-y-5 rounded-3xl border bg-card p-5">
          <FieldSkeleton labelWidth="w-20" controlClassName="h-10" />
          <FieldSkeleton labelWidth="w-16" controlClassName="h-10" />
          <FieldSkeleton labelWidth="w-12" controlClassName="h-11" />
          <FieldSkeleton labelWidth="w-20" controlClassName="h-10" />
          <FieldSkeleton labelWidth="w-12" controlClassName="h-11" />
          <FieldSkeleton labelWidth="w-12" controlClassName="h-24" />

          <div className="flex gap-3 pt-2">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        </div>
      </section>
    </main>
  )
}

function FieldSkeleton({
  labelWidth,
  controlClassName,
}: {
  labelWidth: string
  controlClassName: string
}) {
  return (
    <div className="space-y-2">
      <Skeleton className={`h-4 ${labelWidth}`} />
      <Skeleton className={`w-full rounded-lg ${controlClassName}`} />
    </div>
  )
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-[#e6e5e0] ${className}`} />
}
