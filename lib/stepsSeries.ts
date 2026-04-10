import type { StepEntry } from '@/lib/storage'
import { localDateKey, parseEntryDateMs } from '@/lib/dateHelpers'

export type StepDayPoint = {
  dateKey: string
  label: string
  steps: number
  /** Change vs previous logged day in this series (null for first point). */
  delta: number | null
}

/** Sum steps per local calendar day, then sort ascending by date. */
export function sumStepsByDateKey(entries: StepEntry[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const e of entries) {
    const k = localDateKey(parseEntryDateMs(e.date))
    m.set(k, (m.get(k) ?? 0) + Math.max(0, Math.round(e.steps)))
  }
  return m
}

/**
 * Last `dayCount` calendar days ending today (inclusive). Missing days = 0 steps.
 * Delta compares each day to the previous calendar day in the series.
 */
export function buildStepsSeries(entries: StepEntry[], dayCount: number): StepDayPoint[] {
  const byDay = sumStepsByDateKey(entries)
  const out: StepDayPoint[] = []
  const today = new Date()
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    d.setHours(12, 0, 0, 0)
    const ms = d.getTime()
    const dateKey = localDateKey(ms)
    const steps = byDay.get(dateKey) ?? 0
    out.push({
      dateKey,
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      steps,
      delta: null,
    })
  }
  for (let i = 0; i < out.length; i++) {
    if (i === 0) {
      out[i].delta = null
    } else {
      out[i].delta = out[i].steps - out[i - 1].steps
    }
  }
  return out
}
