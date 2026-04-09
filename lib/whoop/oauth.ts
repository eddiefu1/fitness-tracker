import type { WhoopTokenResponse } from '@/lib/whoop/types'

const TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token'

async function postToken(
  body: Record<string, string>
): Promise<{ ok: true; data: WhoopTokenResponse } | { ok: false; error: string }> {
  const attempts: Array<{ type: 'form' | 'json'; body: string }> = [
    {
      type: 'form',
      body: new URLSearchParams(body).toString(),
    },
    {
      type: 'json',
      body: JSON.stringify(body),
    },
  ]

  let lastErr = 'Token request failed'

  for (const a of attempts) {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type':
          a.type === 'form' ? 'application/x-www-form-urlencoded' : 'application/json',
      },
      body: a.body,
    })
    const json = (await res.json().catch(() => null)) as WhoopTokenResponse & {
      error?: string
      error_description?: string
    }
    if (res.ok && json?.access_token) {
      return { ok: true, data: json as WhoopTokenResponse }
    }
    lastErr =
      json?.error_description ||
      json?.error ||
      (await res.text().catch(() => res.statusText)) ||
      `HTTP ${res.status}`
  }

  return { ok: false, error: lastErr }
}

export async function exchangeAuthorizationCode(
  code: string,
  redirectUri: string
): Promise<{ ok: true; data: WhoopTokenResponse } | { ok: false; error: string }> {
  const clientId = process.env.WHOOP_CLIENT_ID?.trim()
  const clientSecret = process.env.WHOOP_CLIENT_SECRET?.trim()
  if (!clientId || !clientSecret) {
    return { ok: false, error: 'WHOOP client not configured' }
  }
  return postToken({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  })
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<{ ok: true; data: WhoopTokenResponse } | { ok: false; error: string }> {
  const clientId = process.env.WHOOP_CLIENT_ID?.trim()
  const clientSecret = process.env.WHOOP_CLIENT_SECRET?.trim()
  if (!clientId || !clientSecret) {
    return { ok: false, error: 'WHOOP client not configured' }
  }
  return postToken({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'offline',
  })
}
