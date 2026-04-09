/**
 * Public origin for WHOOP OAuth redirect_uri. Uses the incoming request URL so
 * redirect_uri matches the browser hostname (avoids errors when NEXT_PUBLIC_APP_URL
 * points at a different host than the one you opened).
 */
export function getOAuthPublicBaseUrl(request: Request): string {
  return new URL(request.url).origin
}
