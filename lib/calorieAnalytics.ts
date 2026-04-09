import type { FoodEntry, WeightEntry } from '@/lib/storage'
import { PLAN_REFERENCE_WEIGHT_LB, getDailyCalorieTargetForWeightLb, getTDEE } from '@/lib/calorieTarget'
import { localDateKey, parseEntryDateMs } from '@/lib/dateHelpers'

export type DailyCaloriePoint = {
  dateKey: string
  /** Short label for chart axis (e.g. "Apr 4") */
  label: string
  calories: number
  target: number
  tdee: number
  /** Weight (lb) used for that day’s TDEE / target */
  weightLb: number
}

export type WeekCalorieSummary = {
  /** Calendar week Sun–Sat (local) containing `today` */
  weekStartKey: string
  weekEndKey: string
  days: Array<{
    dateKey: string
    label: string
    calories: number
    target: number
    over: boolean
  }>
  totalCalories: number
  totalTargetBudget: number
  /** Positive = over weekly budget */
  surplusVsBudget: number
  /** Days in week where calories > target */
  daysOverTarget: number
}

function weightLbOnOrBefore(weights: WeightEntry[], dateKey: string): number {
  const sorted = [...weights].sort(
    (a, b) => parseEntryDateMs(a.date) - parseEntryDateMs(b.date)
  )
  let best = PLAN_REFERENCE_WEIGHT_LB
  for (const e of sorted) {
    if (localDateKey(parseEntryDateMs(e.date)) <= dateKey) {
      best = e.weight
    }
  }
  return best
}

function sumFoodCaloriesForDay(food: FoodEntry[], dateKey: string): number {
  return food
    .filter((e) => localDateKey(parseEntryDateMs(e.date)) === dateKey)
    .reduce((s, e) => s + e.calories, 0)
}

function formatShortLabel(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Last `count` calendar days ending today (inclusive), local time.
 */
export function buildDailyCalorieSeries(
  food: FoodEntry[],
  weights: WeightEntry[],
  count: number
): DailyCaloriePoint[] {
  const out: DailyCaloriePoint[] = []
  const today = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    d.setHours(12, 0, 0, 0)
    const ms = d.getTime()
    const dateKey = localDateKey(ms)
    const wLb = weightLbOnOrBefore(weights, dateKey)
    const tdee = getTDEE(wLb)
    const target = getDailyCalorieTargetForWeightLb(wLb)
    const calories = sumFoodCaloriesForDay(food, dateKey)
    out.push({
      dateKey,
      label: formatShortLabel(ms),
      calories,
      target,
      tdee,
      weightLb: wLb,
    })
  }
  return out
}

/** Start of calendar week (Sunday 00:00 local) for the given date. */
export function startOfWeekSunday(d: Date): Date {
  const x = new Date(d)
  const day = x.getDay()
  x.setDate(x.getDate() - day)
  x.setHours(0, 0, 0, 0)
  return x
}

export function buildCurrentWeekSunSatSummary(
  food: FoodEntry[],
  weights: WeightEntry[],
  now = new Date()
): WeekCalorieSummary {
  const start = startOfWeekSunday(now)
  const days: WeekCalorieSummary['days'] = []
  let totalCalories = 0
  let totalTargetBudget = 0
  let daysOverTarget = 0

  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    d.setHours(12, 0, 0, 0)
    const ms = d.getTime()
    const dateKey = localDateKey(ms)
    const wLb = weightLbOnOrBefore(weights, dateKey)
    const target = getDailyCalorieTargetForWeightLb(wLb)
    const calories = sumFoodCaloriesForDay(food, dateKey)
    const over = calories > target
    if (over) daysOverTarget += 1
    totalCalories += calories
    totalTargetBudget += target
    days.push({
      dateKey,
      label: formatShortLabel(ms),
      calories,
      target,
      over,
    })
  }

  const surplusVsBudget = totalCalories - totalTargetBudget
  const weekStartKey = localDateKey(start.getTime())
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(12, 0, 0, 0)
  const weekEndKey = localDateKey(end.getTime())

  return {
    weekStartKey,
    weekEndKey,
    days,
    totalCalories,
    totalTargetBudget,
    surplusVsBudget,
    daysOverTarget,
  }
}
