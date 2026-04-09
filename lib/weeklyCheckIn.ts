import type {
  FoodEntry,
  SleepEntry,
  WeightEntry,
  WorkoutEntry,
} from '@/lib/storage'
import { inferWorkoutCategory } from '@/lib/workoutUtils'
import { localDateKey } from '@/lib/dateHelpers'
import {
  GOAL_WEIGHT_HIGH_LB,
  GOAL_WEIGHT_LOW_LB,
  START_WEIGHT_LB,
} from '@/lib/weightLossSummary'

const TARGET_WEEKLY_LOSS_LOW = 0.5
const TARGET_WEEKLY_LOSS_HIGH = 1.0

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
  sleep: SleepEntry[],
  weekStart: Date,
  weekEnd: Date
): WeeklyCheckInResult {
  const label = `${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`

  const weekFood = food.filter((e) => inRange(parseFoodTime(e), weekStart, weekEnd))
  const weekWeights = weights.filter((e) => inRange(Date.parse(e.date), weekStart, weekEnd))
  const weekWorkouts = workouts.filter((e) =>
    inRange(Date.parse(e.date), weekStart, weekEnd)
  )
  const weekSleep = sleep.filter((e) =>
    inRange(Date.parse(e.date), weekStart, weekEnd)
  )

  const sortedAllW = [...weights].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  const latestW =
    sortedAllW.length > 0 ? sortedAllW[sortedAllW.length - 1].weight : null

  const totalLbToGoalMid =
    START_WEIGHT_LB - (GOAL_WEIGHT_LOW_LB + GOAL_WEIGHT_HIGH_LB) / 2
  const weeksAtPoint5 = Math.ceil(totalLbToGoalMid / TARGET_WEEKLY_LOSS_LOW)
  const weeksAt1 = Math.ceil(totalLbToGoalMid / TARGET_WEEKLY_LOSS_HIGH)

  const sections: { title: string; content: string }[] = []

  sections.push({
    title: 'Realistic timeframe (from 243 lb → 185–190 lb)',
    content: [
      `Rough total to lose to the middle of your goal band (~${((GOAL_WEIGHT_LOW_LB + GOAL_WEIGHT_HIGH_LB) / 2).toFixed(0)} lb): about ${totalLbToGoalMid.toFixed(0)} lb from your ${START_WEIGHT_LB} lb start.`,
      `At a sustainable ${TARGET_WEEKLY_LOSS_LOW} lb/week: about ${weeksAtPoint5} weeks (~${Math.round(weeksAtPoint5 / 52 * 10) / 10} years).`,
      `At ${TARGET_WEEKLY_LOSS_HIGH} lb/week: about ${weeksAt1} weeks (~${Math.round(weeksAt1 / 52 * 10) / 10} years).`,
      `Real progress is rarely linear—plateaus and water shifts are normal. Use weekly averages, not single weigh-ins.`,
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
      if (ratePerWeek >= TARGET_WEEKLY_LOSS_LOW && ratePerWeek <= TARGET_WEEKLY_LOSS_HIGH + 0.3) {
        onTrack = `Your recent trend (~${ratePerWeek.toFixed(2)} lb/week) is in a sustainable fat-loss range versus a common ${TARGET_WEEKLY_LOSS_LOW}–${TARGET_WEEKLY_LOSS_HIGH} lb/week target.`
      } else if (ratePerWeek < TARGET_WEEKLY_LOSS_LOW) {
        onTrack = `Your recent trend (~${ratePerWeek.toFixed(2)} lb/week) is slower than the ${TARGET_WEEKLY_LOSS_LOW}–${TARGET_WEEKLY_LOSS_HIGH} lb/week band—still fine if adherence is good; tighten consistency or confirm intake if stalled.`
      } else {
        onTrack = `Your recent trend (~${ratePerWeek.toFixed(2)} lb/week) is faster than typical—watch energy, strength, and hunger; very fast loss can cost muscle.`
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
  const avgSleepQ =
    weekSleep.length > 0
      ? weekSleep.reduce((a, b) => a + b.quality, 0) / weekSleep.length
      : 0

  const recap: string[] = [
    `Food: ${weekFood.length} entries, ~${Math.round(kcal)} kcal for the week (${daysWithFood} days with logs).`,
    `Training: ${weekWorkouts.length} sessions (${strength} strength · ${cardio} cardio).`,
  ]
  if (weekSleep.length > 0) {
    recap.push(
      `Sleep: ${weekSleep.length} logs, avg quality ${avgSleepQ.toFixed(1)}/10.`
    )
  } else {
    recap.push('Sleep: no entries this week.')
  }
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
  if (weekSleep.length > 0 && avgSleepQ < 6.5) {
    suggestions.push(
      'Sleep quality was on the low side—earlier wind-down and consistent wake time often help adherence.'
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
