import { WorkoutEntry, FoodEntry } from './storage'

export interface WellnessScore {
  total: number
  nutrition: number
  exercise: number
  consistency: number
}

/**
 * 100-point score: nutrition vs calorie goal, weekly workouts, logging consistency (food + workouts).
 */
export function calculateWellnessScore(
  workouts: WorkoutEntry[],
  food: FoodEntry[],
  calorieGoal: number
): WellnessScore {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 6)

  const isThisWeek = (dateStr: string) => {
    const d = new Date(dateStr)
    d.setHours(0, 0, 0, 0)
    return d >= weekAgo && d <= today
  }

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr)
    d.setHours(0, 0, 0, 0)
    return d.getTime() === today.getTime()
  }

  const goal = Math.max(calorieGoal, 1)
  const todayCalories = food
    .filter((f) => isToday(f.date))
    .reduce((sum, f) => sum + f.calories, 0)
  const nutritionRatio = Math.min(todayCalories / goal, 1)
  const nutritionScore =
    nutritionRatio >= 0.9 ? 34 : Math.round(nutritionRatio * 34)

  const weekWorkouts = workouts.filter((w) => isThisWeek(w.date))
  let exerciseScore = 0
  if (weekWorkouts.length >= 3) exerciseScore = 33
  else if (weekWorkouts.length === 2) exerciseScore = 22
  else if (weekWorkouts.length === 1) exerciseScore = 12

  const activeDays = new Set<string>()
  workouts
    .filter((w) => isThisWeek(w.date))
    .forEach((w) => activeDays.add(w.date.split('T')[0]))
  food
    .filter((f) => isThisWeek(f.date))
    .forEach((f) => activeDays.add(f.date.split('T')[0]))
  const consistencyScore = Math.round((activeDays.size / 7) * 33)

  return {
    total: nutritionScore + exerciseScore + consistencyScore,
    nutrition: nutritionScore,
    exercise: exerciseScore,
    consistency: consistencyScore,
  }
}
