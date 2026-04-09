import type { WithingsTokenBody } from '@/lib/withings/types'

const TOKEN_URL = 'https://wbsapi.withings.net/v2/oauth2'

function parseTokenPayload(json: unknown): {
  ok: boolean
  body?: WithingsTokenBody
  error?: string
} {
  if (!json || typeof json !== 'object') {
    return { ok: false, error: 'Invalid response' }
  }
  const o = json as Record<string, unknown>
  const status = o.status
  if (status !== 0 && status !== '0') {
    const err = o.body && typeof o.body === 'object' && 'error' in o.body
      ? String((o.body as { error?: string }).error)
      : JSON.stringify(o).slice(0, 200)
    return { ok: false, error: err || `status ${String(status)}` }
  }
  const body = o.body
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Missing body' }
  }
  return { ok: true, body: body as WithingsTokenBody }
}

export async function exchangeAuthorizationCode(
  code: string,
  redirectUri: string
): Promise<{ ok: true; body: WithingsTokenBody } | { ok: false; error: string }> {
  const clientId = process.env.WITHINGS_CLIENT_ID?.trim()
  const clientSecret = process.env.WITHINGS_CLIENT_SECRET?.trim()
  if (!clientId || !clientSecret) {
    return { ok: false, error: 'Withings client not configured' }
  }

  const form = new URLSearchParams({
    action: 'requesttoken',
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
  })

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  })

  const json = await res.json().catch(() => null)
  const parsed = parseTokenPayload(json)
  if (!parsed.ok || !parsed.body) {
    return { ok: false, error: parsed.error || 'Token exchange failed' }
  }
  const b = parsed.body
  if (!b.access_token || !b.refresh_token) {
    return { ok: false, error: 'Missing tokens in response' }
  }
  return { ok: true, body: b }
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<{ ok: true; body: WithingsTokenBody } | { ok: false; error: string }> {
  const clientId = process.env.WITHINGS_CLIENT_ID?.trim()
  const clientSecret = process.env.WITHINGS_CLIENT_SECRET?.trim()
  if (!clientId || !clientSecret) {
    return { ok: false, error: 'Withings client not configured' }
  }

  const form = new URLSearchParams({
    action: 'requesttoken',
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  })

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  })

  const json = await res.json().catch(() => null)
  const parsed = parseTokenPayload(json)
  if (!parsed.ok || !parsed.body) {
    return { ok: false, error: parsed.error || 'Refresh failed' }
  }
  const b = parsed.body
  if (!b.access_token) {
    return { ok: false, error: 'Missing access_token' }
  }
  return { ok: true, body: b }
}
