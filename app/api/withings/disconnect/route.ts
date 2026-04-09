import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const NAMES = [
  'withings_access_token',
  'withings_refresh_token',
  'withings_expires_at',
  'withings_userid',
  'withings_oauth_state',
] as const

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const json = searchParams.get('format') === 'json'

  const target = new URL('/weight?withings=disconnected', request.url)
  const res = json
    ? NextResponse.json({ ok: true })
    : NextResponse.redirect(target)

  for (const n of NAMES) {
    res.cookies.delete(n)
  }
  return res
}
