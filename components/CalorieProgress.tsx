'use client'
import { FoodEntry } from '@/lib/storage'
import {
  DAILY_DEFICIT_KCAL,
  KCAL_PER_LB_MAINTENANCE_MODERATE,
  TARGET_WEEKLY_LOSS_LB,
  getDailyCalorieTarget,
  getTDEE,
  PLAN_REFERENCE_WEIGHT_LB,
} from '@/lib/calorieTarget'
import { localDateKey, localDateKeyNow, parseEntryDateMs } from '@/lib/dateHelpers'

interface Props {
  entries: FoodEntry[]
  /** Latest body weight (lb); drives dynamic TDEE and calorie target. */
  latestWeightLb: number | null
}

const R = 42
const C = 2 * Math.PI * R

export default function CalorieProgress({ entries, latestWeightLb }: Props) {
  const goal = getDailyCalorieTarget(latestWeightLb)
  const refW =
    latestWeightLb != null && latestWeightLb > 0
      ? latestWeightLb
      : PLAN_REFERENCE_WEIGHT_LB
  const tdee = getTDEE(refW)

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

  const isOver = goal > 0 && totals.calories > goal
  const pctOfTarget = goal > 0 ? Math.min((totals.calories / goal) * 100, 100) : 0
  const dash = (pctOfTarget / 100) * C
  const overBy = Math.max(0, totals.calories - goal)
  const remaining = Math.max(goal - totals.calories, 0)

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-6 shadow-xl shadow-emerald-950/20">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-amber-500/5 blur-2xl" />

      <div className="relative flex flex-col sm:flex-row sm:items-start gap-6">
        <div className="flex shrink-0 justify-center sm:justify-start">
          <div className="relative h-40 w-40">
            <svg viewBox="0 0 100 100" className="-rotate-90 h-full w-full">
              <circle
                cx="50"
                cy="50"
                r={R}
                stroke="currentColor"
                strokeWidth="10"
                fill="none"
                className="text-slate-700/80"
              />
              <circle
                cx="50"
                cy="50"
                r={R}
                stroke="currentColor"
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${C}`}
                className={isOver ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.45)]' : 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.35)]'}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
              <span className="text-2xl font-bold tabular-nums text-white leading-none">
                {Math.round(totals.calories)}
              </span>
              <span className="text-[11px] text-slate-500 mt-1">of {goal}</span>
              {isOver ? (
                <span className="text-[11px] font-medium text-rose-400 mt-0.5">
                  +{Math.round(overBy)} over
                </span>
              ) : (
                <span className="text-[11px] text-emerald-400/90 mt-0.5">
                  {Math.round(remaining)} left
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-slate-100 tracking-tight">Today</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Target ~{goal} kcal/day for ~{TARGET_WEEKLY_LOSS_LB} lb/week:{' '}
            <span className="text-slate-400">TDEE ~{tdee} kcal</span> ({refW} lb ×{' '}
            {KCAL_PER_LB_MAINTENANCE_MODERATE} kcal/lb) − ~{Math.round(DAILY_DEFICIT_KCAL)} kcal
            deficit.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-900/60 border border-cyan-500/20 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">TDEE (est.)</p>
              <p className="text-xl font-bold text-cyan-300 tabular-nums">{tdee}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">scales with logged weight</p>
            </div>
            <div className="rounded-xl bg-slate-900/60 border border-emerald-500/20 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Intake target</p>
              <p className="text-xl font-bold text-emerald-300 tabular-nums">{goal}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">TDEE − ~{Math.round(DAILY_DEFICIT_KCAL)} kcal</p>
            </div>
          </div>

          <div className="mt-4 h-2.5 rounded-full bg-slate-700/80 overflow-hidden ring-1 ring-slate-600/30">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOver
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${Math.min(pctOfTarget, 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            Bar caps at 100% of target so you can see distance to goal; ring shows same cap — overages
            in red.
          </p>
        </div>
      </div>

      <div className="relative mt-6 grid grid-cols-3 gap-3 border-t border-slate-700/50 pt-5">
        <div className="rounded-xl bg-slate-900/50 border border-slate-700/50 p-3 text-center">
          <p className="text-blue-400 font-bold text-lg tabular-nums">{Math.round(totals.protein)}g</p>
          <p className="text-xs text-slate-500">Protein</p>
        </div>
        <div className="rounded-xl bg-slate-900/50 border border-slate-700/50 p-3 text-center">
          <p className="text-amber-300 font-bold text-lg tabular-nums">{Math.round(totals.carbs)}g</p>
          <p className="text-xs text-slate-500">Carbs</p>
        </div>
        <div className="rounded-xl bg-slate-900/50 border border-slate-700/50 p-3 text-center">
          <p className="text-orange-400 font-bold text-lg tabular-nums">{Math.round(totals.fat)}g</p>
          <p className="text-xs text-slate-500">Fat</p>
        </div>
      </div>
    </div>
  )
}
