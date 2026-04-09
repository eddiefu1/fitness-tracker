import type { WorkoutCategory, WorkoutEntry } from '@/lib/storage'

/** Resolve category for display and stats (legacy entries used `type` only). */
export function inferWorkoutCategory(w: WorkoutEntry): WorkoutCategory {
  if (w.category) return w.category
  if (w.type === 'Weight Training') return 'strength'
  return 'cardio'
}

export function categoryLabel(c: WorkoutCategory): string {
  return c === 'strength' ? 'Strength' : 'Cardio'
}

export function categoryBadgeClass(c: WorkoutCategory): string {
  return c === 'strength'
    ? 'bg-amber-600/30 text-amber-300'
    : 'bg-cyan-600/30 text-cyan-300'
}
