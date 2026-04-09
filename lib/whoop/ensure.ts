import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { refreshAccessToken } from '@/lib/whoop/oauth'

export type EnsureWhoopResult =
  | {
      ok: true
      accessToken: string
      cookieUpdates: Record<string, string> | null
    }
  | { ok: false; error: string }

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 180,
}

export function applyWhoopCookies(res: NextResponse, updates: Record<string, string>) {
  for (const [k, v] of Object.entries(updates)) {
    res.cookies.set(k, v, COOKIE_OPTS)
  }
}

export async function ensureWhoopAccess(): Promise<EnsureWhoopResult> {
  const c = cookies()
  const access = c.get('whoop_access_token')?.value
  const refresh = c.get('whoop_refresh_token')?.value
  const exp = c.get('whoop_expires_at')?.value

  if (!refresh) {
    return { ok: false, error: 'Not connected to WHOOP' }
  }

  const expiresMs = exp ? Number(exp) : 0
  const stillValid =
    access && expiresMs > 0 && Date.now() < expiresMs - 30_000

  if (stillValid && access) {
    return { ok: true, accessToken: access, cookieUpdates: null }
  }

  const r = await refreshAccessToken(refresh)
  if (!r.ok) {
    return { ok: false, error: r.error }
  }

  const d = r.data
  const newAccess = d.access_token
  const newRefresh = d.refresh_token ?? refresh
  const expiresIn = d.expires_in ?? 3600
  const expiresAt = Date.now() + expiresIn * 1000

  return {
    ok: true,
    accessToken: newAccess,
    cookieUpdates: {
      whoop_access_token: newAccess,
      whoop_refresh_token: newRefresh,
      whoop_expires_at: String(expiresAt),
    },
  }
}
