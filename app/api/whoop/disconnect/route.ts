import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const NAMES = [
  'whoop_access_token',
  'whoop_refresh_token',
  'whoop_expires_at',
  'whoop_oauth_state',
] as const

export async function GET(request: Request) {
  const target = new URL('/whoop?whoop=disconnected', request.url)
  const res = NextResponse.redirect(target)
  for (const n of NAMES) {
    res.cookies.delete(n)
  }
  return res
}
