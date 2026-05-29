import { LoginForm } from "@/app/login/login-form"

type SearchParams = Promise<{
  reset?: string | string[]
  verified?: string | string[]
}>

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const reset = Array.isArray(params.reset) ? params.reset[0] : params.reset
  const verified = Array.isArray(params.verified) ? params.verified[0] : params.verified

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f7f7f4] px-4 py-10">
      <LoginForm reset={reset} verified={verified} />
    </main>
  )
}
