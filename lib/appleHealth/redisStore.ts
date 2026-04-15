import type { StepEntry, WeightEntry, WorkoutEntry } from '@/lib/storage'

const SNAPSHOT_KEY = 'fitness-tracker:apple-health:v1'

export type AppleHealthPersistedSnapshot = {
  updatedAt: string
  steps: StepEntry[]
  weight: WeightEntry[]
  workouts: WorkoutEntry[]
}

export function isAppleHealthRedisConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  )
}

function mergeByIdPreferIncoming<T extends { id: string; date: string }>(
  existing: T[],
  incoming: T[]
): T[] {
  const m = new Map<string, T>()
  for (const x of existing) m.set(x.id, x)
  for (const x of incoming) m.set(x.id, x)
  return Array.from(m.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

async function getRedis() {
  const { Redis } = await import('@upstash/redis')
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
}

function emptySnapshot(): AppleHealthPersistedSnapshot {
  return {
    updatedAt: new Date(0).toISOString(),
    steps: [],
    weight: [],
    workouts: [],
  }
}

function parseSnapshot(raw: unknown): AppleHealthPersistedSnapshot | null {
  if (typeof raw !== 'string') return null
  try {
    const j = JSON.parse(raw) as AppleHealthPersistedSnapshot
    if (!j || typeof j !== 'object') return null
    return {
      updatedAt: typeof j.updatedAt === 'string' ? j.updatedAt : new Date().toISOString(),
      steps: Array.isArray(j.steps) ? j.steps : [],
      weight: Array.isArray(j.weight) ? j.weight : [],
      workouts: Array.isArray(j.workouts) ? j.workouts : [],
    }
  } catch {
    return null
  }
}

/**
 * Merge a new ingest into the Redis snapshot (incoming overwrites same id).
 */
export async function mergeIntoPersistedSnapshot(payload: {
  steps: StepEntry[]
  weight: WeightEntry[]
  workouts: WorkoutEntry[]
}): Promise<AppleHealthPersistedSnapshot> {
  const redis = await getRedis()
  const prevRaw = await redis.get(SNAPSHOT_KEY)
  const prev = parseSnapshot(prevRaw) ?? emptySnapshot()
  const next: AppleHealthPersistedSnapshot = {
    updatedAt: new Date().toISOString(),
    steps: mergeByIdPreferIncoming(prev.steps, payload.steps),
    weight: mergeByIdPreferIncoming(prev.weight, payload.weight),
    workouts: mergeByIdPreferIncoming(prev.workouts, payload.workouts),
  }
  await redis.set(SNAPSHOT_KEY, JSON.stringify(next))
  return next
}

/**
 * Returns merged server snapshot, or empty rows if nothing was stored yet.
 * Returns `null` only when Redis env is not configured.
 */
export async function getPersistedSnapshotOrEmpty(): Promise<AppleHealthPersistedSnapshot | null> {
  if (!isAppleHealthRedisConfigured()) return null
  const redis = await getRedis()
  const prevRaw = await redis.get(SNAPSHOT_KEY)
  return (
    parseSnapshot(prevRaw) ?? {
      updatedAt: '',
      steps: [],
      weight: [],
      workouts: [],
    }
  )
}
