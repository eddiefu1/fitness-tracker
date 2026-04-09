import type { FoodEntry, WeightEntry, WorkoutEntry } from '@/lib/storage'
import { TARGET_WEEKLY_LOSS_LB } from '@/lib/calorieTarget'
import { inferWorkoutCategory } from '@/lib/workoutUtils'
import { localDateKey } from '@/lib/dateHelpers'
import {
  GOAL_WEIGHT_HIGH_LB,
  GOAL_WEIGHT_LOW_LB,
  START_WEIGHT_LB,
} from '@/lib/weightLossSummary'

/** Pace band around the ~1.5 lb/week plan (lb/week). */
const PACE_LOW = 1.0
const PACE_HIGH = 2.0

export type WeeklyCheckInResult = {
  weekLabel: string
  sections: { title: string; content: string }[]
}

function inRange(t: number, start: Date, end: Date): boolean {
  return t >= start.getTime() && t <= end.getTime()
}

function parseFoodTime(e: FoodEntry): number {
  const t = Date.parse(e.date)
  return Number.isFinite(t) ? t : 0
}

/**
 * Weekly review for the last completed Sun–Sat week: timeframe, on-track, last week recap.
 */
export function buildWeeklyCheckIn(
  food: FoodEntry[],
  weights: WeightEntry[],
  workouts: WorkoutEntry[],
  weekStart: Date,
  weekEnd: Date
): WeeklyCheckInResult {
  const label = `${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`

  const weekFood = food.filter((e) => inRange(parseFoodTime(e), weekStart, weekEnd))
  const weekWeights = weights.filter((e) => inRange(Date.parse(e.date), weekStart, weekEnd))
  const weekWorkouts = workouts.filter((e) =>
    inRange(Date.parse(e.date), weekStart, weekEnd)
  )

  const sortedAllW = [...weights].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  const latestW =
    sortedAllW.length > 0 ? sortedAllW[sortedAllW.length - 1].weight : null

  const totalLbToGoalMid =
    START_WEIGHT_LB - (GOAL_WEIGHT_LOW_LB + GOAL_WEIGHT_HIGH_LB) / 2
  const weeksAtTarget = Math.ceil(
    totalLbToGoalMid / Math.max(TARGET_WEEKLY_LOSS_LB, 0.1)
  )

  const sections: { title: string; content: string }[] = []

  sections.push({
    title: 'Realistic timeframe (from 243 lb → 185–190 lb)',
    content: [
      `Rough total to lose to the middle of your goal band (~${((GOAL_WEIGHT_LOW_LB + GOAL_WEIGHT_HIGH_LB) / 2).toFixed(0)} lb): about ${totalLbToGoalMid.toFixed(0)} lb from your ${START_WEIGHT_LB} lb start.`,
      `Your app targets ~${TARGET_WEEKLY_LOSS_LB} lb/week (calorie goal updates with weight). At that pace: about ${weeksAtTarget} weeks (~${Math.round((weeksAtTarget / 52) * 10) / 10} years) if it stayed perfectly linear (it won’t—plateaus and water shifts are normal).`,
      `Use weekly averages, not single weigh-ins.`,
    ].join('\n\n'),
  })

  let ratePerWeek: number | null = null
  if (sortedAllW.length >= 2) {
    const first = sortedAllW[0]
    const last = sortedAllW[sortedAllW.length - 1]
    const t0 = new Date(first.date).getTime()
    const t1 = new Date(last.date).getTime()
    const days = Math.max(1, (t1 - t0) / (86400 * 1000))
    const lb = first.weight - last.weight
    ratePerWeek = (lb / days) * 7
  }

  let onTrack = ''
  if (latestW != null && latestW > GOAL_WEIGHT_HIGH_LB) {
    if (ratePerWeek != null && ratePerWeek > 0) {
      const remaining = latestW - (GOAL_WEIGHT_LOW_LB + GOAL_WEIGHT_HIGH_LB) / 2
      const estWeeks = ratePerWeek > 0 ? remaining / ratePerWeek : null
      if (ratePerWeek >= PACE_LOW && ratePerWeek <= PACE_HIGH) {
        onTrack = `Your recent trend (~${ratePerWeek.toFixed(2)} lb/week) is in the ballpark of your ~${TARGET_WEEKLY_LOSS_LB} lb/week plan (${PACE_LOW}–${PACE_HIGH} lb/week band).`
      } else if (ratePerWeek < PACE_LOW) {
        onTrack = `Your recent trend (~${ratePerWeek.toFixed(2)} lb/week) is slower than your ~${TARGET_WEEKLY_LOSS_LB} lb/week target—still fine if adherence is good; tighten consistency or confirm intake if stalled.`
      } else {
        onTrack = `Your recent trend (~${ratePerWeek.toFixed(2)} lb/week) is faster than the plan—watch energy, strength, and hunger; very fast loss can cost muscle.`
      }
      if (estWeeks != null && Number.isFinite(estWeeks) && estWeeks > 0 && estWeeks < 520) {
        onTrack += ` At this rough pace, about ${Math.round(estWeeks)} more weeks to near the goal band (estimate only).`
      }
    } else {
      onTrack =
        'Log weight at least twice, a week or more apart, to estimate whether your pace lines up with your target.'
    }
  } else if (latestW != null) {
    onTrack =
      'You are at or below your goal band—focus on maintenance, performance, and habits.'
  } else {
    onTrack = 'Log weight on the Weight page to judge if your pace matches your plan.'
  }

  sections.push({
    title: 'Are you on track?',
    content: onTrack,
  })

  const kcal = weekFood.reduce((s, e) => s + e.calories, 0)
  const daysWithFood = new Set(weekFood.map((e) => localDateKey(parseFoodTime(e)))).size
  const strength = weekWorkouts.filter(
    (w) => inferWorkoutCategory(w) === 'strength'
  ).length
  const cardio = weekWorkouts.filter(
    (w) => inferWorkoutCategory(w) === 'cardio'
  ).length

  const recap: string[] = [
    `Food: ${weekFood.length} entries, ~${Math.round(kcal)} kcal for the week (${daysWithFood} days with logs).`,
    `Training: ${weekWorkouts.length} sessions (${strength} strength · ${cardio} cardio).`,
  ]
  if (weekWeights.length > 0) {
    const last = [...weekWeights].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0]
    recap.push(`Weight: ${weekWeights.length} log(s), latest in week ${last.weight} lb.`)
  }

  const suggestions: string[] = []
  if (daysWithFood < 5) {
    suggestions.push(
      'Try logging food on more days next week so calorie intake reflects reality.'
    )
  }
  if (strength < 2) {
    suggestions.push(
      'Aim for at least two strength sessions next week to protect muscle while losing fat.'
    )
  }
  if (suggestions.length === 0) {
    suggestions.push(
      'Solid week on the basics—keep protein up, repeat what worked, and adjust calories only in small steps.'
    )
  }

  sections.push({
    title: `Last week recap (${label})`,
    content: recap.join('\n'),
  })

  sections.push({
    title: 'Suggestions for how you did last week',
    content: suggestions.join('\n\n'),
  })

  return { weekLabel: label, sections }
}
