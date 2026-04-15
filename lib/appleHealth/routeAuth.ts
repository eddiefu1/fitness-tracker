import { NextResponse } from 'next/server'

export function readAppleHealthBearer(req: Request): string | null {
  const h = req.headers.get('authorization') || req.headers.get('Authorization')
  if (!h || !h.startsWith('Bearer ')) return null
  return h.slice('Bearer '.length).trim() || null
}

export function appleHealthSecretConfigured(): boolean {
  const s = process.env.APPLE_HEALTH_SYNC_SECRET
  return Boolean(s && s.length >= 8)
}

export function verifyAppleHealthBearer(req: Request): NextResponse | null {
  if (!appleHealthSecretConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'APPLE_HEALTH_SYNC_SECRET is not set (add an 8+ character secret in .env).',
      },
      { status: 503 }
    )
  }
  const secret = process.env.APPLE_HEALTH_SYNC_SECRET!
  const token = readAppleHealthBearer(req)
  if (!token || token !== secret) {
    return NextResponse.json(
      { ok: false, error: 'Invalid or missing Authorization: Bearer token.' },
      { status: 401 }
    )
  }
  return null
}
