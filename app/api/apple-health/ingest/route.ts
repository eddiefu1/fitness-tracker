import { NextResponse } from 'next/server'
import { normalizeAppleHealthPayload } from '@/lib/appleHealth/merge'
import type { AppleHealthIngestPayload } from '@/lib/appleHealth/types'
import { verifyAppleHealthBearer } from '@/lib/appleHealth/routeAuth'
import {
  isAppleHealthRedisConfigured,
  mergeIntoPersistedSnapshot,
} from '@/lib/appleHealth/redisStore'

export const dynamic = 'force-dynamic'

/**
 * Accepts JSON from Shortcuts or a native app using HKHealthStore.
 * When Upstash Redis is configured, merges into a server snapshot so the web app can pull
 * into localStorage without pasting JSON.
 */
export async function POST(req: Request) {
  const authErr = verifyAppleHealthBearer(req)
  if (authErr) return authErr

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'Body must be a JSON object.' }, { status: 400 })
  }

  const payload = body as AppleHealthIngestPayload
  const { steps, weight, workouts, errors } = normalizeAppleHealthPayload(payload)

  let persisted = false
  let serverSyncedAt: string | undefined
  if (isAppleHealthRedisConfigured()) {
    const snap = await mergeIntoPersistedSnapshot({ steps, weight, workouts })
    persisted = true
    serverSyncedAt = snap.updatedAt
  }

  return NextResponse.json({
    ok: true,
    normalized: { steps, weight, workouts },
    counts: {
      steps: steps.length,
      weight: weight.length,
      workouts: workouts.length,
    },
    persisted,
    serverSyncedAt: persisted ? serverSyncedAt : undefined,
    persistenceHint: !isAppleHealthRedisConfigured()
      ? 'Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to persist data for GET /api/apple-health/pull.'
      : undefined,
    validationWarnings: errors.length ? errors : undefined,
    hint: persisted
      ? 'Snapshot updated. Open FitTracker → Apple Health → “Pull from cloud” to merge into this browser.'
      : 'Set Upstash Redis env vars so POSTs persist; then use Pull from cloud on the Apple Health page.',
  })
}
