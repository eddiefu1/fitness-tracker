import type {
  AppleHealthIngestPayload,
  AppleHealthMergeResult,
  AppleHealthStepInput,
  AppleHealthWeightInput,
  AppleHealthWorkoutInput,
} from '@/lib/appleHealth/types'
import type { StepEntry, WeightEntry, WorkoutEntry } from '@/lib/storage'
import { storage } from '@/lib/storage'

const PREFIX = 'apple-hk-'

function hkId(raw: string): string {
  const t = raw.trim()
  if (t.startsWith(PREFIX)) return t
  return `${PREFIX}${t}`
}

function parseIsoDate(s: string): Date | null {
  const d = new Date(s)
  return Number.isFinite(d.getTime()) ? d : null
}

export function normalizeStepInput(s: AppleHealthStepInput): StepEntry | null {
  const id = hkId(s.id)
  const d = parseIsoDate(s.date)
  if (!d) return null
  const steps = Math.round(Number(s.steps))
  if (!Number.isFinite(steps) || steps < 0 || steps > 2_000_000) return null
  return { id, date: d.toISOString(), steps }
}

export function normalizeWeightInput(w: AppleHealthWeightInput): WeightEntry | null {
  const id = hkId(w.id)
  const d = parseIsoDate(w.date)
  if (!d) return null
  let lb: number | undefined
  if (typeof w.weightLb === 'number' && Number.isFinite(w.weightLb)) lb = w.weightLb
  else if (typeof w.weightKg === 'number' && Number.isFinite(w.weightKg))
    lb = w.weightKg * 2.2046226218
  if (lb === undefined || lb <= 0 || lb > 2000) return null
  return { id, date: d.toISOString(), weight: Math.round(lb * 10) / 10 }
}

export function normalizeWorkoutInput(w: AppleHealthWorkoutInput): WorkoutEntry | null {
  const id = hkId(w.id)
  const d = parseIsoDate(w.date)
  if (!d) return null
  const duration = Number(w.duration)
  const caloriesBurned = Number(w.caloriesBurned)
  const type = String(w.type || 'Workout').trim() || 'Workout'
  if (!Number.isFinite(duration) || duration < 0 || duration > 24 * 60 * 14) return null
  if (!Number.isFinite(caloriesBurned) || caloriesBurned < 0 || caloriesBurned > 50000) return null
  const entry: WorkoutEntry = {
    id,
    date: d.toISOString(),
    type,
    duration: Math.round(duration * 100) / 100,
    caloriesBurned: Math.round(caloriesBurned * 10) / 10,
    notes: typeof w.notes === 'string' ? w.notes : '',
    category: w.category,
  }
  return entry
}

/**
 * Normalize a payload (for API responses) without touching storage.
 */
export function normalizeAppleHealthPayload(
  payload: AppleHealthIngestPayload
): {
  steps: StepEntry[]
  weight: WeightEntry[]
  workouts: WorkoutEntry[]
  errors: string[]
} {
  const errors: string[] = []
  const steps: StepEntry[] = []
  const weight: WeightEntry[] = []
  const workouts: WorkoutEntry[] = []

  for (const s of payload.steps ?? []) {
    const n = normalizeStepInput(s)
    if (n) steps.push(n)
    else errors.push(`invalid step: ${JSON.stringify(s)}`)
  }
  for (const w of payload.weight ?? []) {
    const n = normalizeWeightInput(w)
    if (n) weight.push(n)
    else errors.push(`invalid weight: ${JSON.stringify(w)}`)
  }
  for (const wo of payload.workouts ?? []) {
    const n = normalizeWorkoutInput(wo)
    if (n) workouts.push(n)
    else errors.push(`invalid workout: ${JSON.stringify(wo)}`)
  }

  return { steps, weight, workouts, errors }
}

function countNewIds<T extends { id: string }>(incoming: T[], existingIds: Set<string>): number {
  let n = 0
  for (const x of incoming) {
    if (!existingIds.has(x.id)) n++
  }
  return n
}

/**
 * Merge normalized entries into localStorage (dedupe by id).
 */
export function mergeAppleHealthIntoStorage(
  payload: AppleHealthIngestPayload
): AppleHealthMergeResult & { errors: string[] } {
  const { steps, weight, workouts, errors } = normalizeAppleHealthPayload(payload)

  const stepExisting = new Set(storage.getStepEntries().map((e) => e.id))
  const weightExisting = new Set(storage.getWeightEntries().map((e) => e.id))
  const workoutExisting = new Set(storage.getWorkouts().map((e) => e.id))

  const stepsAdded = countNewIds(steps, stepExisting)
  const weightAdded = countNewIds(weight, weightExisting)
  const workoutsAdded = countNewIds(workouts, workoutExisting)

  storage.mergeStepEntriesFromAppleHealth(steps)
  storage.mergeWeightEntriesFromAppleHealth(weight)
  storage.mergeWorkoutsFromAppleHealth(workouts)

  return {
    stepsAdded,
    weightAdded,
    workoutsAdded,
    stepsSkipped: steps.length - stepsAdded,
    weightSkipped: weight.length - weightAdded,
    workoutsSkipped: workouts.length - workoutsAdded,
    errors,
  }
}
