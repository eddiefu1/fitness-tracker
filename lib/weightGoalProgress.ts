import type { WeightEntry } from '@/lib/storage'
import {
  GOAL_WEIGHT_HIGH_LB,
  GOAL_WEIGHT_LOW_LB,
  START_WEIGHT_LB,
} from '@/lib/weightLossSummary'

const TARGET_WEEKLY_LOSS_LOW = 0.5
const TARGET_WEEKLY_LOSS_HIGH = 1.0

/** Midpoint of the goal band (lb). */
export const GOAL_WEIGHT_MID_LB = (GOAL_WEIGHT_LOW_LB + GOAL_WEIGHT_HIGH_LB) / 2

export type WeightGoalDashboard = {
  latestLb: number | null
  latestDateLabel: string | null
  goalBandLabel: string
  lbLostFromStart: number | null
  lbToMid: number | null
  percentFromStartToMid: number | null
  inGoalBand: boolean
  /** True when recent loss rate is in a sustainable band (roughly 0.5–1.0 lb/wk). */
  onTrackPace: boolean
  ratePerWeek: number | null
  /** Only set when onTrackPace and above goal; days to reach midpoint at current trend. */
  estimatedDaysToGoalMid: number | null
  /** Days until the next Sunday (local); 0 on Sunday. */
  daysUntilNextSunday: number
}

function sortedByDateAsc(weights: WeightEntry[]): WeightEntry[] {
  return [...weights].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}

/**
 * Days until next calendar Sunday (local). Sunday → 0.
 */
export function daysUntilNextSunday(now = new Date()): number {
  const d = now.getDay()
  return d === 0 ? 0 : 7 - d
}

/**
 * Dashboard metrics: target band, progress vs start, pace, optional countdown to goal if on track.
 */
export function computeWeightGoalDashboard(
  weights: WeightEntry[],
  now = new Date()
): WeightGoalDashboard {
  const sorted = sortedByDateAsc(weights)
  const latest = sorted.length ? sorted[sorted.length - 1] : null
  const latestLb = latest ? latest.weight : null
  const latestDateLabel = latest
    ? new Date(latest.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  let ratePerWeek: number | null = null
  if (sorted.length >= 2) {
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    const t0 = new Date(first.date).getTime()
    const t1 = new Date(last.date).getTime()
    const days = Math.max(1, (t1 - t0) / (86400 * 1000))
    const lbLost = first.weight - last.weight
    ratePerWeek = (lbLost / days) * 7
  }

  const goalBandLabel = `${GOAL_WEIGHT_LOW_LB}–${GOAL_WEIGHT_HIGH_LB} lb`

  let lbLostFromStart: number | null = null
  let lbToMid: number | null = null
  let percentFromStartToMid: number | null = null
  let inGoalBand = false
  let onTrackPace = false
  let estimatedDaysToGoalMid: number | null = null

  if (latestLb != null) {
    lbLostFromStart = START_WEIGHT_LB - latestLb
    inGoalBand =
      latestLb >= GOAL_WEIGHT_LOW_LB && latestLb <= GOAL_WEIGHT_HIGH_LB
    const totalSpan = START_WEIGHT_LB - GOAL_WEIGHT_MID_LB
    if (totalSpan > 0) {
      const progressed = START_WEIGHT_LB - latestLb
      percentFromStartToMid = Math.min(
        100,
        Math.max(0, (progressed / totalSpan) * 100)
      )
    }
    if (latestLb > GOAL_WEIGHT_MID_LB) {
      lbToMid = latestLb - GOAL_WEIGHT_MID_LB
    } else {
      lbToMid = 0
    }

    if (ratePerWeek != null && ratePerWeek > 0) {
      onTrackPace =
        ratePerWeek >= TARGET_WEEKLY_LOSS_LOW &&
        ratePerWeek <= TARGET_WEEKLY_LOSS_HIGH + 0.35
      if (
        onTrackPace &&
        latestLb > GOAL_WEIGHT_HIGH_LB &&
        lbToMid != null &&
        lbToMid > 0
      ) {
        const weeks = lbToMid / ratePerWeek
        if (Number.isFinite(weeks) && weeks > 0 && weeks < 520) {
          estimatedDaysToGoalMid = Math.max(1, Math.round(weeks * 7))
        }
      }
    }
  }

  return {
    latestLb,
    latestDateLabel,
    goalBandLabel,
    lbLostFromStart,
    lbToMid,
    percentFromStartToMid,
    inGoalBand,
    onTrackPace,
    ratePerWeek,
    estimatedDaysToGoalMid,
    daysUntilNextSunday: daysUntilNextSunday(now),
  }
}
