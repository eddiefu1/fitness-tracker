import type { WorkoutEntry } from '@/lib/storage'

/**
 * Payload produced by an iOS client (Shortcuts / Swift using HKHealthStore) or
 * pasted into the Apple Health page. IDs should be stable HealthKit UUIDs;
 * merge logic prefixes with `apple-hk-` when missing.
 */
export type AppleHealthIngestPayload = {
  /** ISO timestamp when the export was built (optional, for display). */
  exportedAt?: string
  steps?: AppleHealthStepInput[]
  weight?: AppleHealthWeightInput[]
  workouts?: AppleHealthWorkoutInput[]
}

export type AppleHealthStepInput = {
  /** HealthKit sample UUID or existing `apple-hk-*` id */
  id: string
  /** ISO-8601; sample start or day aggregate timestamp */
  date: string
  steps: number
}

export type AppleHealthWeightInput = {
  id: string
  date: string
  /** Prefer one of weightLb / weightKg (lb matches the rest of the app). */
  weightLb?: number
  weightKg?: number
}

export type AppleHealthWorkoutInput = {
  id: string
  date: string
  type: string
  duration: number
  caloriesBurned: number
  notes?: string
  category?: WorkoutEntry['category']
}

export type AppleHealthMergeResult = {
  stepsAdded: number
  weightAdded: number
  workoutsAdded: number
  stepsSkipped: number
  weightSkipped: number
  workoutsSkipped: number
}
