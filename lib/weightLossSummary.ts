import type { FoodEntry, WeightEntry, WorkoutEntry } from '@/lib/storage'
import {
  DAILY_DEFICIT_KCAL,
  TARGET_WEEKLY_LOSS_LB,
  estimateMaintenanceKcal,
  getDailyCalorieTarget,
} from '@/lib/calorieTarget'
import { localDateKey, parseEntryDateMs } from '@/lib/dateHelpers'
import { inferWorkoutCategory } from '@/lib/workoutUtils'

/** Starting weight (lb) for this plan—journey framed from here to the goal band. */
export const START_WEIGHT_LB = 243

/** Target bodyweight range (lb) shown on the summary page. */
export const GOAL_WEIGHT_LOW_LB = 185
export const GOAL_WEIGHT_HIGH_LB = 190

export type WeightLossSummaryBlock = {
  title: string
  content: string
}

type WeekSlice = {
  workouts: WorkoutEntry[]
  food: FoodEntry[]
  weight: WeightEntry[]
}

/**
 * General summary for ~185–190 lb goal, food/workouts/weight logs, and ~1.5 lb/week calorie framing.
 */
export function buildWeightLossSummary(
  week: WeekSlice,
  allWeights: WeightEntry[]
): WeightLossSummaryBlock[] {
  const blocks: WeightLossSummaryBlock[] = []

  const sortedW = [...allWeights].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  const latest = sortedW[0]

  const lossToGoalHigh = START_WEIGHT_LB - GOAL_WEIGHT_HIGH_LB
  const lossToGoalLow = START_WEIGHT_LB - GOAL_WEIGHT_LOW_LB

  const totalCal = week.food.reduce((s, e) => s + e.calories, 0)
  const daysWithFood = new Set(
    week.food.map((e) => localDateKey(parseEntryDateMs(e.date)))
  ).size
  const avgDailyCal =
    totalCal > 0 ? Math.round(totalCal / Math.max(daysWithFood, 1)) : 0
  const avgDailyCalWeek = Math.round(totalCal / 7)

  const refW = latest?.weight ?? START_WEIGHT_LB
  const targetKcal = getDailyCalorieTarget(latest?.weight ?? null)
  const maint = estimateMaintenanceKcal(refW)

  const journeyIntro = [
    `Starting point for this plan: ${START_WEIGHT_LB} lb. Goal band: ${GOAL_WEIGHT_LOW_LB}–${GOAL_WEIGHT_HIGH_LB} lb.`,
    `From ${START_WEIGHT_LB} lb, reaching the goal band means losing about ${lossToGoalHigh} lb (to ${GOAL_WEIGHT_HIGH_LB} lb) up to ${lossToGoalLow} lb (to ${GOAL_WEIGHT_LOW_LB} lb)—roughly ${lossToGoalHigh}–${lossToGoalLow} lb total.`,
    `Calorie target in the app uses ~${maint} kcal maintenance at ${refW} lb (moderate activity, ~15 kcal/lb) minus ~${Math.round(DAILY_DEFICIT_KCAL)} kcal/day for ~${TARGET_WEEKLY_LOSS_LB} lb/week → about ${targetKcal} kcal/day intake (not medical advice).`,
  ].join('\n\n')

  let goalLine = ''
  let progressLine = ''
  if (latest) {
    const w = latest.weight
    const d = new Date(latest.date).toLocaleDateString()
    const deltaFromStart = START_WEIGHT_LB - w
    if (deltaFromStart > 0.5) {
      progressLine = `Versus your ${START_WEIGHT_LB} lb start, your latest log is about ${deltaFromStart.toFixed(1)} lb lower.`
    } else if (deltaFromStart < -0.5) {
      progressLine = `Your latest log is above the ${START_WEIGHT_LB} lb starting point (water, time of day, or normal fluctuation)—watch the weekly average, not single days.`
    } else {
      progressLine = `Your latest log is about the same as your ${START_WEIGHT_LB} lb starting point—keep logging weekly to see the trend.`
    }

    if (w > GOAL_WEIGHT_HIGH_LB) {
      const toBandHigh = (w - GOAL_WEIGHT_HIGH_LB).toFixed(1)
      const toBandLow = (w - GOAL_WEIGHT_LOW_LB).toFixed(1)
      goalLine = `Latest logged weight: ${w} lb (${d}). Still above the ${GOAL_WEIGHT_LOW_LB}–${GOAL_WEIGHT_HIGH_LB} lb band by about ${toBandHigh}–${toBandLow} lb (to the top vs bottom of that band).\n\n${progressLine}`
    } else if (w >= GOAL_WEIGHT_LOW_LB && w <= GOAL_WEIGHT_HIGH_LB) {
      goalLine = `Latest logged weight: ${w} lb (${d}). You are inside the ${GOAL_WEIGHT_LOW_LB}–${GOAL_WEIGHT_HIGH_LB} lb goal band—focus on maintaining habits and strength.\n\n${progressLine}`
    } else {
      goalLine = `Latest logged weight: ${w} lb (${d}). Below the ${GOAL_WEIGHT_LOW_LB}–${GOAL_WEIGHT_HIGH_LB} lb range; prioritize maintenance, performance, and health, and discuss major changes with a clinician if needed.\n\n${progressLine}`
    }
  } else {
    goalLine = `Log at least one weight on the Weight page so this summary can compare your trend to your ${START_WEIGHT_LB} lb start and the ${GOAL_WEIGHT_LOW_LB}–${GOAL_WEIGHT_HIGH_LB} lb goal.`
  }

  blocks.push({
    title: `Your journey: ${START_WEIGHT_LB} lb → ${GOAL_WEIGHT_LOW_LB}–${GOAL_WEIGHT_HIGH_LB} lb`,
    content: `${journeyIntro}\n\n${goalLine}`,
  })

  blocks.push({
    title: 'Baselines that support fat loss (general)',
    content: [
      `Calories: This app targets ~${TARGET_WEEKLY_LOSS_LB} lb/week via ~${Math.round(DAILY_DEFICIT_KCAL)} kcal/day below estimated maintenance (weight × 15 kcal/lb for moderate activity). Adjust with a dietitian if needed.`,
      'Protein: Aim for roughly 0.7–1 g per lb body weight daily (or the high end of your comfort range) to protect muscle in a deficit.',
      'Training: 2 or more strength sessions per week plus regular walking and daily movement (NEAT).',
      'Consistency: Logging food most days beats perfect logging once in a while.',
    ].join('\n\n'),
  })

  const strengthSessions = week.workouts.filter(
    (w) => inferWorkoutCategory(w) === 'strength'
  ).length
  const cardioSessions = week.workouts.filter(
    (w) => inferWorkoutCategory(w) === 'cardio'
  ).length

  const weekLines = [
    `Workouts logged: ${week.workouts.length} (${strengthSessions} strength · ${cardioSessions} cardio)`,
    `Food entries (week): ${week.food.length} (${daysWithFood} distinct days with at least one entry)`,
    `Estimated calories (7 days): ${Math.round(totalCal)} total (~${avgDailyCalWeek} kcal/day if spread evenly across the week)`,
  ]
  if (daysWithFood > 0 && totalCal > 0) {
    weekLines.push(
      `On days you logged food: average ~${avgDailyCal} kcal/day (rough—depends on how complete logging is).`
    )
  }
  const wk = week.weight
  if (wk.length > 0) {
    const lastWeek = [...wk].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    weekLines.push(
      `Weight entries (last 7 days): ${wk.length} (latest in window: ${lastWeek[0].weight} lb)`
    )
  }

  blocks.push({
    title: 'Your last 7 days (from logs)',
    content: weekLines.join('\n'),
  })

  const nudges: string[] = []

  if (week.food.length === 0) {
    nudges.push(
      'No food logged this week—start by logging most meals for a few days so calorie awareness matches your deficit goal.'
    )
  } else if (daysWithFood < 4) {
    nudges.push(
      'Food logging is sparse—try logging at least 5–7 days this coming week to see true intake vs target.'
    )
  }

  if (week.workouts.length < 2) {
    nudges.push(
      'Few sessions logged this week—aim for at least a couple of workouts when possible.'
    )
  } else if (week.workouts.length >= 4) {
    nudges.push(
      'Solid training volume this week—watch recovery and protein so the deficit does not erode performance.'
    )
  }

  if (strengthSessions < 2) {
    nudges.push(
      'Resistance training: a common baseline is 2+ strength sessions per week to preserve muscle in a deficit.'
    )
  }

  if (totalCal > 0 && totalCal / 7 < 1200) {
    nudges.push(
      'Seven-day logged calories are very low on average—very aggressive deficits can backfire (muscle loss, fatigue). Consider a moderate deficit and, if unsure, professional guidance.'
    )
  }

  if (nudges.length === 0) {
    nudges.push(
      `Keep the basics: aim near your daily calorie target for ~${TARGET_WEEKLY_LOSS_LB} lb/week, high protein, regular lifting, and steps. Adjust slowly based on weekly weight trend.`
    )
  }

  blocks.push({
    title: 'What to focus on next (based on baselines + your week)',
    content: nudges.join('\n\n'),
  })

  return blocks
}
