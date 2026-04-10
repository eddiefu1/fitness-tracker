import type { WhoopStoredData, WhoopRecovery, WhoopSleep, WhoopCycle, WhoopWorkout } from '@/lib/whoop/types'

export type LatestWhoopMetrics = {
  /** Latest non-nap sleep performance % (0–100). Null if no scored data. */
  sleepPerformancePct: number | null
  /** Latest non-nap sleep duration in hours. */
  sleepDurationHours: number | null
  /** Latest recovery score (0–100). */
  recoveryScore: number | null
  /** Latest HRV in ms (rmssd). */
  hrv: number | null
  /** Latest resting heart rate (bpm). */
  rhr: number | null
  /** Latest scored cycle strain (0–21). */
  cycleStrain: number | null
  /** 7-day average recovery score. */
  avgRecovery7d: number | null
  /** Workouts logged in the last 7 days (WHOOP-tracked). */
  whoopWorkouts7d: number
  /** ISO string of most recent sync. */
  syncedAt: string | null
  /** Whether any WHOOP data is available at all. */
  hasData: boolean
}

function safeNum(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function parseDate(iso: string | undefined): Date | null {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isFinite(d.getTime()) ? d : null
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

/** Derive the latest display-ready WHOOP metrics from stored data. */
export function extractLatestWhoopMetrics(data: WhoopStoredData | null): LatestWhoopMetrics {
  if (!data) {
    return {
      sleepPerformancePct: null,
      sleepDurationHours: null,
      recoveryScore: null,
      hrv: null,
      rhr: null,
      cycleStrain: null,
      avgRecovery7d: null,
      whoopWorkouts7d: 0,
      syncedAt: null,
      hasData: false,
    }
  }

  const now = Date.now()

  // --- Recovery ---
  const scoredRecoveries = (data.recoveries as WhoopRecovery[]).filter(
    (r) => r.score_state === 'SCORED' && r.score != null
  )
  scoredRecoveries.sort(
    (a, b) =>
      (parseDate(b.created_at)?.getTime() ?? 0) - (parseDate(a.created_at)?.getTime() ?? 0)
  )

  const latestRec = scoredRecoveries[0]
  const recoveryScore = safeNum(latestRec?.score?.recovery_score)
  const hrv = safeNum(latestRec?.score?.hrv_rmssd_milli)
  const rhr = safeNum(latestRec?.score?.resting_heart_rate)

  const rec7d = scoredRecoveries.filter((r) => {
    const t = parseDate(r.created_at)?.getTime() ?? 0
    return now - t <= SEVEN_DAYS_MS
  })
  const avgRecovery7d =
    rec7d.length > 0
      ? Math.round(
          rec7d.reduce((s, r) => s + (safeNum(r.score?.recovery_score) ?? 0), 0) / rec7d.length
        )
      : null

  // --- Sleep ---
  const scoredSleeps = (data.sleeps as WhoopSleep[]).filter(
    (s) => !s.nap && s.score_state === 'SCORED' && s.score != null
  )
  scoredSleeps.sort(
    (a, b) => (parseDate(b.start)?.getTime() ?? 0) - (parseDate(a.start)?.getTime() ?? 0)
  )

  const latestSleep = scoredSleeps[0]
  const sleepPerformancePct = safeNum(latestSleep?.score?.sleep_performance_percentage)
  let sleepDurationHours: number | null = null
  if (latestSleep?.start && latestSleep?.end) {
    const s = parseDate(latestSleep.start)
    const e = parseDate(latestSleep.end)
    if (s && e) {
      const h = (e.getTime() - s.getTime()) / 3_600_000
      sleepDurationHours = Number.isFinite(h) && h > 0 && h < 24 ? Math.round(h * 10) / 10 : null
    }
  }

  // --- Cycle strain ---
  const scoredCycles = (data.cycles as WhoopCycle[]).filter(
    (c) => c.score_state === 'SCORED' && c.score != null
  )
  scoredCycles.sort(
    (a, b) => (parseDate(b.start)?.getTime() ?? 0) - (parseDate(a.start)?.getTime() ?? 0)
  )
  const cycleStrain = safeNum(scoredCycles[0]?.score?.strain)

  // --- Workouts last 7 days ---
  const whoopWorkouts7d = (data.workouts as WhoopWorkout[]).filter((w) => {
    const t = parseDate(w.start)?.getTime() ?? 0
    return now - t <= SEVEN_DAYS_MS
  }).length

  return {
    sleepPerformancePct,
    sleepDurationHours,
    recoveryScore,
    hrv,
    rhr,
    cycleStrain,
    avgRecovery7d,
    whoopWorkouts7d,
    syncedAt: data.syncedAt,
    hasData: true,
  }
}

/** Color class for a 0–100 percentage score. */
export function scoreColor(value: number | null): string {
  if (value == null) return 'text-slate-500'
  if (value >= 67) return 'text-emerald-400'
  if (value >= 34) return 'text-amber-400'
  return 'text-rose-400'
}

/** Short label for a 0–100 score. */
export function scoreLabel(value: number | null): string {
  if (value == null) return '—'
  if (value >= 67) return 'Optimal'
  if (value >= 34) return 'Moderate'
  return 'Low'
}

/** Strain label (0–21 scale). */
export function strainLabel(strain: number | null): string {
  if (strain == null) return '—'
  if (strain >= 18) return 'All Out'
  if (strain >= 14) return 'Overreaching'
  if (strain >= 10) return 'Strenuous'
  if (strain >= 6) return 'Moderate'
  return 'Light'
}

export function strainColor(strain: number | null): string {
  if (strain == null) return 'text-slate-500'
  if (strain >= 18) return 'text-rose-400'
  if (strain >= 14) return 'text-orange-400'
  if (strain >= 10) return 'text-amber-400'
  if (strain >= 6) return 'text-emerald-400'
  return 'text-sky-400'
}
