import type { WorkoutEntry, FoodEntry, StepEntry } from './storage'
import type { LatestWhoopMetrics } from './whoopMetrics'

/** Six-pillar comprehensive wellness score out of 100. */
export interface WellnessScore {
  total: number
  recovery: number   // 0–20: WHOOP recovery score
  sleep: number      // 0–20: WHOOP sleep performance
  activity: number   // 0–20: workouts (manual + WHOOP) + strain
  nutrition: number  // 0–20: calories vs target
  steps: number      // 0–10: daily steps vs 10k goal
  consistency: number // 0–10: logging consistency this week
  /** True when WHOOP data contributed to recovery/sleep pillars. */
  hasWhoopData: boolean
  /** True when step data contributed. */
  hasStepData: boolean
}

const STEPS_GOAL = 10_000

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function todayMs(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function weekAgoMs(): number {
  const d = new Date()
  d.setDate(d.getDate() - 6)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/**
 * 100-point wellness score combining manual logs, WHOOP biometrics, and step data.
 *
 * Pillars:
 *  Recovery (20 pts)   — WHOOP recovery score; 0 if no data
 *  Sleep    (20 pts)   — WHOOP sleep performance; 0 if no data
 *  Activity (20 pts)   — weekly workouts + WHOOP strain
 *  Nutrition (20 pts)  — today's calories vs target
 *  Steps    (10 pts)   — today's steps vs 10k
 *  Consistency (10 pts)— days logged this week (food, workouts)
 */
export function calculateWellnessScore(
  workouts: WorkoutEntry[],
  food: FoodEntry[],
  calorieGoal: number,
  whoopMetrics: LatestWhoopMetrics | null = null,
  stepEntries: StepEntry[] = []
): WellnessScore {
  const tod = todayMs()
  const wkAgo = weekAgoMs()

  const isThisWeek = (dateStr: string) => {
    const d = new Date(dateStr)
    d.setHours(0, 0, 0, 0)
    return d.getTime() >= wkAgo && d.getTime() <= tod
  }

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr)
    d.setHours(0, 0, 0, 0)
    return d.getTime() === tod
  }

  // --- Recovery (20 pts) ---
  let recovery = 0
  if (whoopMetrics?.hasData && whoopMetrics.recoveryScore != null) {
    recovery = Math.round((whoopMetrics.recoveryScore / 100) * 20)
  }

  // --- Sleep (20 pts) ---
  let sleep = 0
  if (whoopMetrics?.hasData && whoopMetrics.sleepPerformancePct != null) {
    sleep = Math.round((whoopMetrics.sleepPerformancePct / 100) * 20)
  }

  // --- Activity (20 pts): workouts 0–12, strain bonus 0–8 ---
  const manualWeekWorkouts = workouts.filter((w) => isThisWeek(w.date)).length
  const whoopWeek = whoopMetrics?.whoopWorkouts7d ?? 0
  const totalWeekWorkouts = manualWeekWorkouts + whoopWeek
  let workoutPts = 0
  if (totalWeekWorkouts >= 5) workoutPts = 12
  else if (totalWeekWorkouts === 4) workoutPts = 10
  else if (totalWeekWorkouts === 3) workoutPts = 8
  else if (totalWeekWorkouts === 2) workoutPts = 5
  else if (totalWeekWorkouts === 1) workoutPts = 2

  let strainPts = 0
  if (whoopMetrics?.hasData && whoopMetrics.cycleStrain != null) {
    // Strain 0–21: sweet spot is 8–16 → full 8 pts; extremes penalised slightly
    const s = whoopMetrics.cycleStrain
    if (s >= 8 && s <= 16) strainPts = 8
    else if (s >= 6) strainPts = 6
    else if (s >= 4) strainPts = 4
    else strainPts = 2
  }

  const activity = clamp(workoutPts + strainPts, 0, 20)

  // --- Nutrition (20 pts) ---
  const goal = Math.max(calorieGoal, 1)
  const todayKcal = food.filter((f) => isToday(f.date)).reduce((s, f) => s + f.calories, 0)
  const nutRatio = todayKcal / goal
  let nutrition = 0
  if (nutRatio >= 0.85 && nutRatio <= 1.05) nutrition = 20  // within budget
  else if (nutRatio >= 0.7 && nutRatio <= 1.15) nutrition = 14
  else if (nutRatio >= 0.5 && nutRatio <= 1.3) nutrition = 8
  else if (todayKcal > 0) nutrition = 4

  // --- Steps (10 pts) ---
  const todayKey = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()
  const todaySteps = stepEntries
    .filter((e) => {
      const d = new Date(e.date)
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      return k === todayKey
    })
    .reduce((s, e) => s + e.steps, 0)
  let steps = 0
  const hasStepData = stepEntries.length > 0
  if (hasStepData) {
    steps = clamp(Math.round((todaySteps / STEPS_GOAL) * 10), 0, 10)
  }

  // --- Consistency (10 pts): days with food OR workout log this week ---
  const activeDays = new Set<string>()
  workouts.filter((w) => isThisWeek(w.date)).forEach((w) => activeDays.add(w.date.split('T')[0]))
  food.filter((f) => isThisWeek(f.date)).forEach((f) => activeDays.add(f.date.split('T')[0]))
  const consistency = Math.round((activeDays.size / 7) * 10)

  const total = clamp(recovery + sleep + activity + nutrition + steps + consistency, 0, 100)

  return {
    total,
    recovery,
    sleep,
    activity,
    nutrition,
    steps,
    consistency,
    hasWhoopData: whoopMetrics?.hasData ?? false,
    hasStepData,
  }
}
