/** BMI from weight (lb) and height (in). Returns null if inputs invalid. */
export function bmiFromLbIn(weightLb: number, heightInches: number): number | null {
  if (!(weightLb > 0) || !(heightInches > 0)) return null
  const bmi = (703 * weightLb) / (heightInches * heightInches)
  if (!Number.isFinite(bmi)) return null
  return Math.round(bmi * 10) / 10
}

export function bmiCategoryLabel(bmi: number): string {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Healthy range'
  if (bmi < 30) return 'Overweight'
  return 'Obese'
}
