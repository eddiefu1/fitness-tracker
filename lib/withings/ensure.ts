import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { refreshAccessToken } from '@/lib/withings/oauth'

export type EnsureAccessResult =
  | {
      ok: true
      accessToken: string
      userid: number
      /** If set, apply to NextResponse with cookies.set for each key */
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

export function applyWithingsCookies(
  res: NextResponse,
  updates: Record<string, string>
) {
  for (const [k, v] of Object.entries(updates)) {
    res.cookies.set(k, v, COOKIE_OPTS)
  }
}

/**
 * Returns a valid access token, refreshing with the refresh token when needed.
 */
export async function ensureWithingsAccess(): Promise<EnsureAccessResult> {
  const c = cookies()
  const access = c.get('withings_access_token')?.value
  const refresh = c.get('withings_refresh_token')?.value
  const exp = c.get('withings_expires_at')?.value
  const uid = c.get('withings_userid')?.value

  if (!refresh || !uid) {
    return { ok: false, error: 'Not connected to Withings' }
  }

  const userid = Number(uid)
  if (!Number.isFinite(userid)) {
    return { ok: false, error: 'Invalid Withings session' }
  }

  const expiresMs = exp ? Number(exp) : 0
  const stillValid =
    access &&
    expiresMs > 0 &&
    Date.now() < expiresMs - 30_000

  if (stillValid && access) {
    return { ok: true, accessToken: access, userid, cookieUpdates: null }
  }

  const r = await refreshAccessToken(refresh)
  if (!r.ok) {
    return { ok: false, error: r.error }
  }

  const b = r.body
  const newAccess = b.access_token
  if (!newAccess) {
    return { ok: false, error: 'No access token after refresh' }
  }

  const newRefresh = b.refresh_token ?? refresh
  const expiresIn = b.expires_in ?? 10800
  const expiresAt = Date.now() + expiresIn * 1000

  return {
    ok: true,
    accessToken: newAccess,
    userid,
    cookieUpdates: {
      withings_access_token: newAccess,
      withings_refresh_token: newRefresh,
      withings_expires_at: String(expiresAt),
    },
  }
}
