export const passwordRecoveryCookieName = "ledger_password_recovery"

export const passwordRecoveryCookieOptions = {
  httpOnly: true,
  maxAge: 10 * 60,
  path: "/reset-password",
  sameSite: "lax" as const,
}
