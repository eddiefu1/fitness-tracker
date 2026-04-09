/**
 * Server-only FatSecret OAuth2 client credentials + token cache.
 */

let tokenCache: { token: string; expiresAt: number } | null = null

export function getFatSecretEnv(): { clientId: string; clientSecret: string } | null {
  // Set DISABLE_FATSECRET=1 on Vercel (or anywhere) to use Open Food Facts only—no keys needed.
  if (process.env.DISABLE_FATSECRET === '1') return null
  const clientId = process.env.FATSECRET_CLIENT_ID
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET
  if (!clientId?.trim() || !clientSecret?.trim()) return null
  return { clientId, clientSecret }
}

export async function getFatSecretAccessToken(): Promise<string | null> {
  const env = getFatSecretEnv()
  if (!env) return null

  const now = Date.now()
  if (tokenCache && now < tokenCache.expiresAt - 60_000) {
    return tokenCache.token
  }

  const tryToken = async (scope?: string) => {
    const body = new URLSearchParams({ grant_type: 'client_credentials' })
    if (scope) body.set('scope', scope)
    return fetch('https://oauth.fatsecret.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' +
          Buffer.from(`${env.clientId}:${env.clientSecret}`).toString('base64'),
      },
      body,
    })
  }

  let res = await tryToken('premier')
  if (!res.ok) {
    res = await tryToken()
  }

  if (!res.ok) {
    const errText = await res.text()
    console.error('FatSecret token error:', res.status, errText)
    return null
  }

  const data = (await res.json()) as {
    access_token: string
    expires_in?: number
  }

  const expiresInSec = data.expires_in ?? 86400
  tokenCache = {
    token: data.access_token,
    expiresAt: now + expiresInSec * 1000,
  }
  return tokenCache.token
}
