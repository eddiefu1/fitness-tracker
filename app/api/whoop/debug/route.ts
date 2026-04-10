import { NextResponse } from 'next/server'
import { getOAuthPublicBaseUrl } from '@/lib/whoop/oauthBaseUrl'

export const dynamic = 'force-dynamic'

/** Visit /api/whoop/debug to see exactly what redirect_uri will be sent to WHOOP. */
export async function GET(request: Request) {
  const baseUrl = getOAuthPublicBaseUrl(request)
  const redirectUri = `${baseUrl}/api/whoop/callback`
  return NextResponse.json({
    redirectUri,
    baseUrl,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? '(not set)',
    xForwardedHost: request.headers.get('x-forwarded-host') ?? '(not set)',
    xForwardedProto: request.headers.get('x-forwarded-proto') ?? '(not set)',
    requestUrlOrigin: new URL(request.url).origin,
  })
}
