import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { exchangeAuthorizationCode } from '@/lib/whoop/oauth'
import { getOAuthPublicBaseUrl } from '@/lib/whoop/oauthBaseUrl'

export const dynamic = 'force-dynamic'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 180,
}

export async function GET(request: Request) {
  const baseUrl = getOAuthPublicBaseUrl(request)

  const { searchParams } = new URL(request.url)
  const err = searchParams.get('error')
  if (err) {
    return NextResponse.redirect(
      `${baseUrl}/whoop?whoop=error&message=${encodeURIComponent(err)}`
    )
  }

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  if (!code || !state) {
    return NextResponse.redirect(
      `${baseUrl}/whoop?whoop=error&message=${encodeURIComponent('Missing code')}`
    )
  }

  const jar = cookies()
  const saved = jar.get('whoop_oauth_state')?.value
  if (!saved || saved !== state) {
    return NextResponse.redirect(
      `${baseUrl}/whoop?whoop=error&message=${encodeURIComponent('Invalid state')}`
    )
  }

  const redirectUri = `${baseUrl}/api/whoop/callback`
  const tokens = await exchangeAuthorizationCode(code, redirectUri)
  if (!tokens.ok) {
    return NextResponse.redirect(
      `${baseUrl}/whoop?whoop=error&message=${encodeURIComponent(tokens.error)}`
    )
  }

  const d = tokens.data
  const expiresIn = d.expires_in ?? 3600
  const expiresAt = Date.now() + expiresIn * 1000
  if (!d.refresh_token) {
    return NextResponse.redirect(
      `${baseUrl}/whoop?whoop=error&message=${encodeURIComponent('No refresh token — confirm offline scope in WHOOP app settings')}`
    )
  }

  const res = NextResponse.redirect(`${baseUrl}/whoop?whoop=connected`)
  res.cookies.delete('whoop_oauth_state')
  res.cookies.set('whoop_access_token', d.access_token, COOKIE_OPTS)
  res.cookies.set('whoop_refresh_token', d.refresh_token, COOKIE_OPTS)
  res.cookies.set('whoop_expires_at', String(expiresAt), COOKIE_OPTS)
  return res
}
