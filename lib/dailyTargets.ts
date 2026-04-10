import { bmiFromLbIn } from '@/lib/bmi'
import { getDailyCalorieTarget, getTDEE, DAILY_DEFICIT_KCAL } from '@/lib/calorieTarget'
import type { LatestWhoopMetrics } from '@/lib/whoopMetrics'

export type TrainingIntensity = 'rest' | 'light' | 'normal' | 'push'

export type DailyTargets = {
  // Calorie / nutrition
  caloriesTarget: number
  tdee: number
  deficit: number
  proteinG: number
  carbsG: number
  fatG: number

  // Movement
  stepsGoal: number

  // Training weekly targets
  strengthPerWeek: number
  cardioPerWeek: number

  // Sleep
  sleepHoursMin: number
  sleepHoursTarget: number

  // BMI
  bmi: number | null
  bmiCategory: string
  bmiColor: 'emerald' | 'amber' | 'rose'
  /** Lbs to lose to reach BMI 24.9 (top of healthy range). Negative = already under. */
  lbsToHealthyBmi: number | null
  /** Body weight (lb) at BMI 24.9. */
  weightAtBmi25: number | null
  /** Body weight (lb) at BMI 22 (comfortable mid-range). */
  weightAtBmi22: number | null
  /** % progress from start weight to BMI-25 target. */
  bmiProgressPct: number | null

  // Today's session guidance driven by WHOOP recovery
  trainingIntensity: TrainingIntensity
  trainingReason: string
  todayFocus: string[]
}

const START_WEIGHT_LB = 243 // matches weightLossSummary plan start

function weightForBmi(bmiTarget: number, heightInches: number): number {
  return (bmiTarget * heightInches * heightInches) / 703
}

function categoryAndColor(bmi: number): {
  label: string
  color: 'emerald' | 'amber' | 'rose'
} {
  if (bmi < 18.5) return { label: 'Underweight', color: 'amber' }
  if (bmi < 25) return { label: 'Healthy range', color: 'emerald' }
  if (bmi < 30) return { label: 'Overweight', color: 'amber' }
  return { label: 'Obese', color: 'rose' }
}

function intensityFromRecovery(
  recovery: number | null,
  weekWorkouts: number
): { intensity: TrainingIntensity; reason: string } {
  if (recovery == null) {
    return { intensity: 'normal', reason: 'No WHOOP data — train to plan.' }
  }
  if (recovery < 33) {
    return {
      intensity: 'rest',
      reason: `Recovery ${Math.round(recovery)}/100 — low. Prioritise rest, walking, and sleep over hard sessions.`,
    }
  }
  if (recovery < 50) {
    return {
      intensity: 'light',
      reason: `Recovery ${Math.round(recovery)}/100 — below average. Keep intensity moderate; avoid PRs today.`,
    }
  }
  if (recovery >= 67 && weekWorkouts < 4) {
    return {
      intensity: 'push',
      reason: `Recovery ${Math.round(recovery)}/100 — optimal. Good day to push hard or add volume.`,
    }
  }
  return {
    intensity: 'normal',
    reason: `Recovery ${Math.round(recovery)}/100 — solid. Train at normal intensity.`,
  }
}

function todayFocusItems(
  intensity: TrainingIntensity,
  calorieTarget: number,
  stepsGoal: number,
  proteinG: number,
  weekStrength: number,
  weekCardio: number,
  strengthTarget: number,
  cardioTarget: number,
  lbsToGoal: number | null
): string[] {
  const focus: string[] = []

  // Calorie nudge
  focus.push(`Hit ~${calorieTarget} kcal intake today (${Math.round(DAILY_DEFICIT_KCAL)} kcal below TDEE for ~1.5 lb/wk loss).`)

  // Protein
  focus.push(`Target ≥ ${proteinG}g protein — key to preserving muscle in a deficit.`)

  // Steps
  focus.push(`Walk at least ${stepsGoal.toLocaleString()} steps — contributes to NEAT and daily deficit.`)

  // Training
  if (intensity === 'rest') {
    focus.push('Active recovery today: light walk, mobility, or full rest.')
  } else if (intensity === 'light') {
    focus.push('Moderate session or a brisk walk — skip max-effort lifting today.')
  } else if (intensity === 'push') {
    const needsStrength = weekStrength < strengthTarget
    const needsCardio = weekCardio < cardioTarget
    if (needsStrength) focus.push(`Strength session recommended — ${weekStrength}/${strengthTarget} done this week.`)
    else if (needsCardio) focus.push(`Cardio session today — ${weekCardio}/${cardioTarget} done this week.`)
    else focus.push('Training targets met — extra volume or active recovery both fine.')
  } else {
    const needsStrength = weekStrength < strengthTarget
    const needsCardio = weekCardio < cardioTarget
    if (needsStrength) focus.push(`${strengthTarget - weekStrength} more strength session${strengthTarget - weekStrength > 1 ? 's' : ''} to hit weekly target.`)
    if (needsCardio) focus.push(`${cardioTarget - weekCardio} more cardio session${cardioTarget - weekCardio > 1 ? 's' : ''} to hit weekly target.`)
  }

  // Weight loss framing
  if (lbsToGoal != null && lbsToGoal > 0) {
    const weeks = Math.ceil(lbsToGoal / 1.5)
    focus.push(`${lbsToGoal.toFixed(1)} lb to reach healthy BMI zone — ~${weeks} weeks at current pace.`)
  }

  return focus
}

export function computeDailyTargets(
  weightLb: number | null,
  heightInches: number | null,
  whoopMetrics: LatestWhoopMetrics | null,
  weekStrengthCount: number,
  weekCardioCount: number
): DailyTargets {
  const w = weightLb ?? 243
  const h = heightInches

  const tdee = getTDEE(w)
  const caloriesTarget = getDailyCalorieTarget(weightLb)
  const deficit = tdee - caloriesTarget

  // Protein ~1 g/lb (capped at 38% of calories)
  const maxProteinG = Math.floor((caloriesTarget * 0.38) / 4)
  const proteinG = Math.max(140, Math.min(Math.round(w), maxProteinG))
  const fatG = Math.max(40, Math.round((caloriesTarget * 0.26) / 9))
  const carbsG = Math.max(0, Math.round((caloriesTarget - proteinG * 4 - fatG * 9) / 4))

  // BMI + targets
  let bmi: number | null = null
  let bmiCategory = 'No height logged'
  let bmiColor: 'emerald' | 'amber' | 'rose' = 'amber'
  let lbsToHealthyBmi: number | null = null
  let weightAtBmi25: number | null = null
  let weightAtBmi22: number | null = null
  let bmiProgressPct: number | null = null

  if (h != null && h > 0) {
    bmi = bmiFromLbIn(w, h)
    if (bmi != null) {
      const { label, color } = categoryAndColor(bmi)
      bmiCategory = label
      bmiColor = color
      weightAtBmi25 = Math.round(weightForBmi(24.9, h) * 10) / 10
      weightAtBmi22 = Math.round(weightForBmi(22, h) * 10) / 10
      lbsToHealthyBmi = bmi >= 25 ? Math.round((w - weightAtBmi25) * 10) / 10 : 0
      // Progress from start weight to BMI-25 target
      if (weightAtBmi25 < START_WEIGHT_LB) {
        const total = START_WEIGHT_LB - weightAtBmi25
        const done = START_WEIGHT_LB - w
        bmiProgressPct = Math.min(100, Math.max(0, Math.round((done / total) * 100)))
      }
    }
  }

  // Steps goal based on BMI
  let stepsGoal = 10_000
  if (bmi != null) {
    if (bmi >= 35) stepsGoal = 7_500
    else if (bmi >= 30) stepsGoal = 8_500
    else if (bmi >= 25) stepsGoal = 10_000
    else stepsGoal = 10_000
  }

  // Weekly training targets
  const strengthPerWeek = 3
  const cardioPerWeek = 2

  // Sleep
  const sleepHoursMin = 7
  const sleepHoursTarget = 8

  // Training intensity from WHOOP
  const { intensity: trainingIntensity, reason: trainingReason } =
    intensityFromRecovery(whoopMetrics?.recoveryScore ?? null, weekStrengthCount + weekCardioCount)

  // Today's focus list
  const todayFocus = todayFocusItems(
    trainingIntensity,
    caloriesTarget,
    stepsGoal,
    proteinG,
    weekStrengthCount,
    weekCardioCount,
    strengthPerWeek,
    cardioPerWeek,
    lbsToHealthyBmi
  )

  return {
    caloriesTarget,
    tdee,
    deficit,
    proteinG,
    carbsG,
    fatG,
    stepsGoal,
    strengthPerWeek,
    cardioPerWeek,
    sleepHoursMin,
    sleepHoursTarget,
    bmi,
    bmiCategory,
    bmiColor,
    lbsToHealthyBmi,
    weightAtBmi25,
    weightAtBmi22,
    bmiProgressPct,
    trainingIntensity,
    trainingReason,
    todayFocus,
  }
}
