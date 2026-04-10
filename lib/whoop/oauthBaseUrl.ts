/**
 * Public origin for WHOOP OAuth redirect_uri.
 *
 * Priority:
 * 1. NEXT_PUBLIC_APP_URL env var — most reliable on Vercel (set it in the project settings)
 * 2. x-forwarded-host + x-forwarded-proto headers — Vercel proxy fills these in
 * 3. request.url origin — fallback for local dev when no env var is set
 */
export function getOAuthPublicBaseUrl(request: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (env) return env.replace(/\/$/, '')

  const fwdHost = request.headers.get('x-forwarded-host')?.split(',')[0].trim()
  const fwdProto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim() ?? 'https'
  if (fwdHost) return `${fwdProto}://${fwdHost}`

  return new URL(request.url).origin
}
