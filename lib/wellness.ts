import { WorkoutEntry, FoodEntry, SleepEntry } from './storage';

export interface WellnessScore {
  total: number;
  nutrition: number;
  exercise: number;
  sleep: number;
  consistency: number;
}

export function calculateWellnessScore(
  workouts: WorkoutEntry[],
  food: FoodEntry[],
  sleep: SleepEntry[],
  calorieGoal: number = 2000
): WellnessScore {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);

  const isThisWeek = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d >= weekAgo && d <= today;
  };

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  };

  const todayCalories = food
    .filter(f => isToday(f.date))
    .reduce((sum, f) => sum + f.calories, 0);
  const nutritionRatio = Math.min(todayCalories / calorieGoal, 1);
  const nutritionScore = nutritionRatio >= 0.9 ? 25 : Math.round(nutritionRatio * 25);

  const weekWorkouts = workouts.filter(w => isThisWeek(w.date));
  let exerciseScore = 0;
  if (weekWorkouts.length >= 3) exerciseScore = 25;
  else if (weekWorkouts.length === 2) exerciseScore = 18;
  else if (weekWorkouts.length === 1) exerciseScore = 10;

  const weekSleep = sleep.filter(s => isThisWeek(s.date));
  const avgQuality = weekSleep.length > 0
    ? weekSleep.reduce((sum, s) => sum + s.quality, 0) / weekSleep.length
    : 0;
  const sleepScore = avgQuality >= 7 ? 25 : Math.round((avgQuality / 7) * 25);

  const activeDays = new Set<string>();
  workouts.filter(w => isThisWeek(w.date)).forEach(w => activeDays.add(w.date.split('T')[0]));
  food.filter(f => isThisWeek(f.date)).forEach(f => activeDays.add(f.date.split('T')[0]));
  sleep.filter(s => isThisWeek(s.date)).forEach(s => activeDays.add(s.date.split('T')[0]));
  const consistencyScore = Math.round((activeDays.size / 7) * 25);

  return {
    total: nutritionScore + exerciseScore + sleepScore + consistencyScore,
    nutrition: nutritionScore,
    exercise: exerciseScore,
    sleep: sleepScore,
    consistency: consistencyScore,
  };
}
