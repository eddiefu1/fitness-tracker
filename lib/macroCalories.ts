/** Atwater: protein 4, carbs 4, fat 9 kcal per gram */
export function caloriesFromMacros(
  proteinG: number,
  carbsG: number,
  fatG: number
): number {
  const p = Math.max(0, proteinG)
  const c = Math.max(0, carbsG)
  const f = Math.max(0, fatG)
  return Math.round(4 * p + 4 * c + 9 * f)
}
