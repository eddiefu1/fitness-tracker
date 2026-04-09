import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
import { getOAuthPublicBaseUrl } from '@/lib/whoop/oauthBaseUrl'

export const dynamic = 'force-dynamic'

/** WHOOP requires scopes including `offline` for refresh tokens. */
const WHOOP_SCOPES = [
  'offline',
  'read:recovery',
  'read:cycles',
  'read:workout',
  'read:sleep',
  'read:profile',
  'read:body_measurement',
].join(' ')

export async function GET(request: Request) {
  const clientId = process.env.WHOOP_CLIENT_ID?.trim()
  if (!clientId) {
    return NextResponse.json({ error: 'Set WHOOP_CLIENT_ID in environment.' }, { status: 500 })
  }

  const baseUrl = getOAuthPublicBaseUrl(request)

  /** WHOOP docs: state must be 8 characters when self-generated. */
  const state = randomBytes(4).toString('hex')
  const redirectUri = `${baseUrl}/api/whoop/callback`

  const url = new URL('https://api.prod.whoop.com/oauth/oauth2/auth')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', WHOOP_SCOPES)
  url.searchParams.set('state', state)

  const res = NextResponse.redirect(url.toString())
  res.cookies.set('whoop_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  })
  return res
}
