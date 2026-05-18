export default function EditTransactionLoading() {
  return (
    <main className="min-h-dvh bg-[#f7f7f4] px-4 py-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">交易编辑页加载中</span>
      <section className="mx-auto w-full max-w-xl">
        <Skeleton className="h-4 w-24" />

        <div className="mt-5 mb-6 flex items-start justify-between gap-4">
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-40" />
          </div>
          <Skeleton className="h-8 w-14 rounded-lg" />
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
