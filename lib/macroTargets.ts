import { PLAN_REFERENCE_WEIGHT_LB } from '@/lib/calorieTarget'

export type SuggestedMacros = {
  proteinG: number
  carbsG: number
  fatG: number
  proteinPct: number
  carbsPct: number
  fatPct: number
}

/**
 * Macro split for your intake target and weight: high protein (~1 g/lb, capped to fit
 * calories), ~26% kcal from fat, remainder from carbs.
 */
export function getSuggestedMacrosFromIntake(
  intakeKcal: number,
  weightLb: number
): SuggestedMacros {
  const w = weightLb > 0 ? weightLb : PLAN_REFERENCE_WEIGHT_LB
  const goal = Math.max(1, Math.round(intakeKcal))

  const maxProteinG = Math.max(1, Math.floor((goal * 0.38) / 4))
  const proteinG = Math.max(1, Math.min(Math.round(w), maxProteinG))
  const proteinKcal = proteinG * 4

  let fatG = Math.max(1, Math.round((goal * 0.26) / 9))
  let fatKcal = fatG * 9

  if (proteinKcal + fatKcal > goal) {
    fatG = Math.max(35, Math.floor((goal - proteinKcal) / 9))
    fatKcal = fatG * 9
  }

  const carbKcal = Math.max(0, goal - proteinKcal - fatKcal)
  let carbsG = Math.round(carbKcal / 4)

  let totalKcal = proteinKcal + carbsG * 4 + fatKcal
  let drift = goal - totalKcal
  carbsG = Math.max(0, carbsG + Math.round(drift / 4))
  totalKcal = proteinKcal + carbsG * 4 + fatKcal
  drift = goal - totalKcal
  if (Math.abs(drift) >= 2) {
    carbsG = Math.max(0, carbsG + Math.round(drift / 4))
  }

  const g = Math.max(1, goal)
  const proteinPct = Math.round(((proteinG * 4) / g) * 10) / 10
  const fatPct = Math.round((fatKcal / g) * 10) / 10
  const carbsPct = Math.round(((carbsG * 4) / g) * 10) / 10

  return {
    proteinG,
    carbsG,
    fatG,
    proteinPct,
    carbsPct,
    fatPct,
  }
}
