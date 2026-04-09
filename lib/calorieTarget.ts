/** Aligns with plan start in `weightLossSummary` (avoid circular imports). */
export const PLAN_REFERENCE_WEIGHT_LB = 243

/** kcal per lb body weight for estimated maintenance (moderately active). */
export const KCAL_PER_LB_MAINTENANCE_MODERATE = 15

/** Planned average fat loss (lb/week); drives daily deficit. */
export const TARGET_WEEKLY_LOSS_LB = 1.5

/** Daily deficit for TARGET_WEEKLY_LOSS_LB: (lb/week × 3500 kcal/lb) / 7 days */
export const DAILY_DEFICIT_KCAL = (TARGET_WEEKLY_LOSS_LB * 3500) / 7

/**
 * Rough maintenance for moderate activity: weight_lb × 15 kcal/lb (common estimate).
 * Uses latest logged weight when available, else plan reference weight.
 */
export function estimateMaintenanceKcal(weightLb: number): number {
  return Math.round(weightLb * KCAL_PER_LB_MAINTENANCE_MODERATE)
}

/**
 * Dynamic calorie target: maintenance at current (or reference) weight minus deficit for ~1.5 lb/week.
 */
export function getDailyCalorieTarget(latestWeightLb: number | null): number {
  const w =
    latestWeightLb != null && latestWeightLb > 0
      ? latestWeightLb
      : PLAN_REFERENCE_WEIGHT_LB
  const maintenance = estimateMaintenanceKcal(w)
  const target = Math.round(maintenance - DAILY_DEFICIT_KCAL)
  return Math.max(1200, target)
}
