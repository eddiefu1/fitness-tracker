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
  id: string;
  date: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: string;
}

export interface SleepEntry {
  id: string;
  date: string;
  hours: number;
  quality: number;
  bedtime: string;
  wakeTime: string;
}

export interface WeightEntry {
  id: string;
  date: string;
  weight: number;
}

const KEYS = {
  workouts: 'fitness_workouts',
  food: 'fitness_food',
  sleep: 'fitness_sleep',
  weight: 'fitness_weight',
};

function getItems<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveItems<T>(key: string, items: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(items));
}

export const storage = {
  getWorkouts: () => getItems<WorkoutEntry>(KEYS.workouts),
  saveWorkout: (entry: WorkoutEntry) => {
    const items = getItems<WorkoutEntry>(KEYS.workouts);
    saveItems(KEYS.workouts, [entry, ...items]);
  },
  deleteWorkout: (id: string) => {
    const items = getItems<WorkoutEntry>(KEYS.workouts).filter(i => i.id !== id);
    saveItems(KEYS.workouts, items);
  },

  getFoodEntries: () => getItems<FoodEntry>(KEYS.food),
  saveFoodEntry: (entry: FoodEntry) => {
    const items = getItems<FoodEntry>(KEYS.food);
    saveItems(KEYS.food, [entry, ...items]);
  },
  deleteFoodEntry: (id: string) => {
    const items = getItems<FoodEntry>(KEYS.food).filter(i => i.id !== id);
    saveItems(KEYS.food, items);
  },

  getSleepEntries: () => getItems<SleepEntry>(KEYS.sleep),
  saveSleepEntry: (entry: SleepEntry) => {
    const items = getItems<SleepEntry>(KEYS.sleep);
    saveItems(KEYS.sleep, [entry, ...items]);
  },
  deleteSleepEntry: (id: string) => {
    const items = getItems<SleepEntry>(KEYS.sleep).filter(i => i.id !== id);
    saveItems(KEYS.sleep, items);
  },

  getWeightEntries: () => getItems<WeightEntry>(KEYS.weight),
  saveWeightEntry: (entry: WeightEntry) => {
    const items = getItems<WeightEntry>(KEYS.weight);
    saveItems(KEYS.weight, [entry, ...items]);
  },
  deleteWeightEntry: (id: string) => {
    const items = getItems<WeightEntry>(KEYS.weight).filter(i => i.id !== id);
    saveItems(KEYS.weight, items);
  },
};
