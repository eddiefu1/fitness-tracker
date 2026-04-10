'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FoodEntry, storage } from '@/lib/storage'
import {
  DAILY_DEFICIT_KCAL,
  KCAL_PER_LB_MAINTENANCE_MODERATE,
  TARGET_WEEKLY_LOSS_LB,
  getDailyCalorieTarget,
  getTDEE,
  PLAN_REFERENCE_WEIGHT_LB,
} from '@/lib/calorieTarget'
import { getSuggestedMacrosFromIntake } from '@/lib/macroTargets'
import { bmiFromLbIn, bmiCategoryLabel } from '@/lib/bmi'
import { localDateKey, localDateKeyNow, parseEntryDateMs } from '@/lib/dateHelpers'

interface Props {
  entries: FoodEntry[]
  /** Latest body weight (lb); drives dynamic TDEE and calorie target. */
  latestWeightLb: number | null
}

const R = 42
const C = 2 * Math.PI * R

function macroBarPct(actual: number, target: number): number {
  if (target <= 0) return 0
  return Math.min((actual / target) * 100, 100)
}

export default function CalorieProgress({ entries, latestWeightLb }: Props) {
  const [heightIn, setHeightIn] = useState<number | null>(null)

  useEffect(() => {
    const load = () => {
      const h = storage.getProfile().heightInches
      setHeightIn(typeof h === 'number' && h > 0 ? h : null)
    }
    load()
    window.addEventListener('focus', load)
    return () => window.removeEventListener('focus', load)
  }, [])

  const goal = getDailyCalorieTarget(latestWeightLb)
  const refW =
    latestWeightLb != null && latestWeightLb > 0
      ? latestWeightLb
      : PLAN_REFERENCE_WEIGHT_LB
  const tdee = getTDEE(refW)
  const suggested = getSuggestedMacrosFromIntake(goal, refW)

  const bmi =
    heightIn != null && refW > 0 ? bmiFromLbIn(refW, heightIn) : null
  const bmiLabel = bmi != null ? bmiCategoryLabel(bmi) : null

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
  const ringPct = isOver ? 100 : pctOfTarget
  const dash = (ringPct / 100) * C
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

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            <div className="rounded-xl bg-slate-900/60 border border-violet-500/20 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">BMI</p>
              {bmi != null && bmiLabel ? (
                <>
                  <p className="text-xl font-bold text-violet-300 tabular-nums">{bmi}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{bmiLabel}</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-500 mt-1">Add height on the</p>
                  <Link
                    href="/weight"
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    Weight page
                  </Link>
                </>
              )}
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

      <div className="relative mt-6 rounded-xl border border-slate-600/50 bg-slate-900/40 p-4">
        <h3 className="text-sm font-semibold text-slate-200">Suggested macro split</h3>
        <p className="text-[11px] text-slate-500 mt-1 mb-4">
          For your intake target and current weight: higher protein, moderate fat, carbs fill the rest.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(
            [
              {
                key: 'p',
                label: 'Protein',
                target: suggested.proteinG,
                actual: totals.protein,
                color: 'bg-sky-500',
                pct: suggested.proteinPct,
              },
              {
                key: 'c',
                label: 'Carbs',
                target: suggested.carbsG,
                actual: totals.carbs,
                color: 'bg-amber-500',
                pct: suggested.carbsPct,
              },
              {
                key: 'f',
                label: 'Fat',
                target: suggested.fatG,
                actual: totals.fat,
                color: 'bg-orange-500',
                pct: suggested.fatPct,
              },
            ] as const
          ).map((m) => (
            <div key={m.key}>
              <div className="flex justify-between items-baseline gap-2 mb-1.5">
                <span className="text-xs text-slate-400">{m.label}</span>
                <span className="text-xs text-slate-500 tabular-nums">
                  ~{m.pct}% kcal
                </span>
              </div>
              <p className="text-lg font-bold tabular-nums text-white mb-2">
                {Math.round(m.actual)}g
                <span className="text-slate-500 font-normal text-sm">
                  {' '}
                  / {m.target}g
                </span>
              </p>
              <div className="h-2 rounded-full bg-slate-700/80 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${m.color}`}
                  style={{ width: `${macroBarPct(m.actual, m.target)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
