import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { exchangeAuthorizationCode } from '@/lib/withings/oauth'

export const dynamic = 'force-dynamic'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 180,
}

export async function GET(request: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (!baseUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_APP_URL missing' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const err = searchParams.get('error')
  if (err) {
    return NextResponse.redirect(
      `${baseUrl.replace(/\/$/, '')}/weight?withings=error&message=${encodeURIComponent(err)}`
    )
  }

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  if (!code || !state) {
    return NextResponse.redirect(
      `${baseUrl.replace(/\/$/, '')}/weight?withings=error&message=${encodeURIComponent('Missing code')}`
    )
  }

  const jar = cookies()
  const saved = jar.get('withings_oauth_state')?.value
  if (!saved || saved !== state) {
    return NextResponse.redirect(
      `${baseUrl.replace(/\/$/, '')}/weight?withings=error&message=${encodeURIComponent('Invalid state — try Connect again')}`
    )
  }

  const redirectUri = `${baseUrl.replace(/\/$/, '')}/api/withings/callback`
  const tokens = await exchangeAuthorizationCode(code, redirectUri)
  if (!tokens.ok) {
    return NextResponse.redirect(
      `${baseUrl.replace(/\/$/, '')}/weight?withings=error&message=${encodeURIComponent(tokens.error)}`
    )
  }

  const b = tokens.body
  const access = b.access_token!
  const refresh = b.refresh_token!
  const expiresIn = b.expires_in ?? 10800
  const expiresAt = Date.now() + expiresIn * 1000
  const rawUid = b.userid ?? b.user_id
  const userid =
    typeof rawUid === 'number' ? rawUid : rawUid != null ? Number(rawUid) : NaN
  if (!Number.isFinite(userid)) {
    return NextResponse.redirect(
      `${baseUrl.replace(/\/$/, '')}/weight?withings=error&message=${encodeURIComponent('No userid')}`
    )
  }

  const res = NextResponse.redirect(
    `${baseUrl.replace(/\/$/, '')}/weight?withings=connected`
  )
  res.cookies.delete('withings_oauth_state')
  res.cookies.set('withings_access_token', access, COOKIE_OPTS)
  res.cookies.set('withings_refresh_token', refresh, COOKIE_OPTS)
  res.cookies.set('withings_expires_at', String(expiresAt), COOKIE_OPTS)
  res.cookies.set('withings_userid', String(userid), COOKIE_OPTS)
  return res
}
