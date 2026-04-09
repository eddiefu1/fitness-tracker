'use client'
import { FoodEntry } from '@/lib/storage'
import { localDateKey, localDateKeyNow, parseEntryDateMs } from '@/lib/dateHelpers'

interface Props {
  entries: FoodEntry[]
  goal?: number
}

export default function CalorieProgress({ entries, goal = 2000 }: Props) {
  const todayKey = localDateKeyNow()
  const todayEntries = entries.filter(
    (e) => localDateKey(parseEntryDateMs(e.date)) === todayKey
  )

  const totals = todayEntries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const pct = Math.min((totals.calories / goal) * 100, 100)
  const remaining = Math.max(goal - totals.calories, 0)

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
      <h2 className="text-lg font-semibold text-slate-300 mb-4">Today&apos;s Calories</h2>
      <div className="flex justify-between items-end mb-2">
        <div>
          <span className="text-3xl font-bold text-green-400">{Math.round(totals.calories)}</span>
          <span className="text-slate-400 ml-1">/ {goal} kcal</span>
        </div>
        <span className="text-sm text-slate-400">{Math.round(remaining)} remaining</span>
      </div>
      <div className="h-3 bg-slate-700 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            pct > 100 ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-700 rounded-xl p-3 text-center">
          <p className="text-blue-400 font-bold text-lg">{Math.round(totals.protein)}g</p>
          <p className="text-xs text-slate-400">Protein</p>
        </div>
        <div className="bg-slate-700 rounded-xl p-3 text-center">
          <p className="text-yellow-400 font-bold text-lg">{Math.round(totals.carbs)}g</p>
          <p className="text-xs text-slate-400">Carbs</p>
        </div>
        <div className="bg-slate-700 rounded-xl p-3 text-center">
          <p className="text-orange-400 font-bold text-lg">{Math.round(totals.fat)}g</p>
          <p className="text-xs text-slate-400">Fat</p>
        </div>
      </div>
    </div>
  )
}
