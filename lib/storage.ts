import type { WhoopStoredData } from '@/lib/whoop/types'

export type WorkoutCategory = 'strength' | 'cardio'

/** A specific movement or cardio block within a session (e.g. name + sets/reps or duration). */
export interface ExerciseLine {
  name: string
  detail?: string
}

export interface WorkoutEntry {
  id: string
  date: string
  /** Strength (weights) vs cardio; omitted on older logs → inferred from `type`. */
  category?: WorkoutCategory
  type: string
  duration: number
  caloriesBurned: number
  notes: string
  exercises?: ExerciseLine[]
}

export interface FoodEntry {
  id: string
  date: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  servingSize?: string
}

export interface WeightEntry {
  id: string
  date: string
  weight: number
}

export interface StepEntry {
  id: string
  date: string
  /** Total steps for that log (same calendar day sums in analytics). */
  steps: number
}

const KEYS = {
  workouts: 'fitness_workouts',
  food: 'fitness_food',
  weight: 'fitness_weight',
  steps: 'fitness_steps',
  whoop: 'fitness_whoop',
  profile: 'fitness_profile',
}

export type UserProfile = {
  /** Total height in inches (for BMI). */
  heightInches?: number
}

function getItems<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveItems<T>(key: string, items: T[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(items))
}

export const storage = {
  getWorkouts: () => getItems<WorkoutEntry>(KEYS.workouts),
  saveWorkout: (entry: WorkoutEntry) => {
    const items = getItems<WorkoutEntry>(KEYS.workouts)
    saveItems(KEYS.workouts, [entry, ...items])
  },
  deleteWorkout: (id: string) => {
    const items = getItems<WorkoutEntry>(KEYS.workouts).filter((i) => i.id !== id)
    saveItems(KEYS.workouts, items)
  },

  getFoodEntries: () => getItems<FoodEntry>(KEYS.food),
  saveFoodEntry: (entry: FoodEntry) => {
    const items = getItems<FoodEntry>(KEYS.food)
    saveItems(KEYS.food, [entry, ...items])
  },
  deleteFoodEntry: (id: string) => {
    const items = getItems<FoodEntry>(KEYS.food).filter((i) => i.id !== id)
    saveItems(KEYS.food, items)
  },

  getWeightEntries: () => getItems<WeightEntry>(KEYS.weight),
  saveWeightEntry: (entry: WeightEntry) => {
    const items = getItems<WeightEntry>(KEYS.weight)
    saveItems(KEYS.weight, [entry, ...items])
  },
  deleteWeightEntry: (id: string) => {
    const items = getItems<WeightEntry>(KEYS.weight).filter((i) => i.id !== id)
    saveItems(KEYS.weight, items)
  },

  getStepEntries: () => getItems<StepEntry>(KEYS.steps),
  saveStepEntry: (entry: StepEntry) => {
    const items = getItems<StepEntry>(KEYS.steps)
    saveItems(KEYS.steps, [entry, ...items])
  },
  deleteStepEntry: (id: string) => {
    const items = getItems<StepEntry>(KEYS.steps).filter((i) => i.id !== id)
    saveItems(KEYS.steps, items)
  },

  /** Merge Withings imports by id; newest-first order preserved. */
  mergeWeightEntriesFromWithings: (incoming: WeightEntry[]) => {
    const existing = getItems<WeightEntry>(KEYS.weight)
    const byId = new Map(existing.map((e) => [e.id, e]))
    for (const n of incoming) {
      if (!byId.has(n.id)) byId.set(n.id, n)
    }
    const merged = Array.from(byId.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    saveItems(KEYS.weight, merged)
  },

  getWhoopData: (): WhoopStoredData | null => {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(KEYS.whoop)
      return raw ? (JSON.parse(raw) as WhoopStoredData) : null
    } catch {
      return null
    }
  },

  setWhoopData: (data: WhoopStoredData) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(KEYS.whoop, JSON.stringify(data))
  },

  clearWhoopData: () => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(KEYS.whoop)
  },

  getProfile: (): UserProfile => {
    if (typeof window === 'undefined') return {}
    try {
      const raw = localStorage.getItem(KEYS.profile)
      return raw ? (JSON.parse(raw) as UserProfile) : {}
    } catch {
      return {}
    }
  },

  setProfile: (patch: Partial<UserProfile>) => {
    if (typeof window === 'undefined') return
    let cur: UserProfile = {}
    try {
      const raw = localStorage.getItem(KEYS.profile)
      if (raw) cur = JSON.parse(raw) as UserProfile
    } catch {
      cur = {}
    }
    localStorage.setItem(KEYS.profile, JSON.stringify({ ...cur, ...patch }))
  },
}
