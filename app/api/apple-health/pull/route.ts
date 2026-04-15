import { NextResponse } from 'next/server'
import { verifyAppleHealthBearer } from '@/lib/appleHealth/routeAuth'
import {
  getPersistedSnapshotOrEmpty,
  isAppleHealthRedisConfigured,
} from '@/lib/appleHealth/redisStore'

export const dynamic = 'force-dynamic'

/**
 * Returns the latest merged Apple Health snapshot from Redis for merging into localStorage.
 * Same Bearer token as POST /ingest.
 */
export async function GET(req: Request) {
  const authErr = verifyAppleHealthBearer(req)
  if (authErr) return authErr

  if (!isAppleHealthRedisConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Redis not configured. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (e.g. free Upstash) and redeploy.',
      },
      { status: 503 }
    )
  }

  const snap = await getPersistedSnapshotOrEmpty()
  if (!snap) {
    return NextResponse.json(
      { ok: false, error: 'Could not read Apple Health snapshot from storage.' },
      { status: 500 }
    )
  }

  const rowCount = snap.steps.length + snap.weight.length + snap.workouts.length

  return NextResponse.json({
    ok: true,
    normalized: {
      steps: snap.steps,
      weight: snap.weight,
      workouts: snap.workouts,
    },
    serverSyncedAt: snap.updatedAt || null,
    empty: !snap.updatedAt && rowCount === 0,
  })
}
