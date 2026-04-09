import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const clientId = process.env.WITHINGS_CLIENT_ID?.trim()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (!clientId || !baseUrl) {
    return NextResponse.json(
      { error: 'Set WITHINGS_CLIENT_ID and NEXT_PUBLIC_APP_URL in environment.' },
      { status: 500 }
    )
  }

  const state = randomBytes(16).toString('hex')
  const redirectUri = `${baseUrl.replace(/\/$/, '')}/api/withings/callback`

  const url = new URL('https://account.withings.com/oauth2_user/authorize2')
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', 'user.metrics')
  url.searchParams.set('state', state)

  const res = NextResponse.redirect(url.toString())
  res.cookies.set('withings_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  })
  return res
}
