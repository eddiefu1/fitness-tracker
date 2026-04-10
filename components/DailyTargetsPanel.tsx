'use client'

import Link from 'next/link'
import type { DailyTargets } from '@/lib/dailyTargets'

type Props = {
  targets: DailyTargets
  weekStrengthDone: number
  weekCardioDone: number
}

const intensityConfig = {
  rest: { label: 'Rest / Recover', dot: 'bg-rose-500', bar: 'from-rose-700 to-rose-500', text: 'text-rose-400' },
  light: { label: 'Light training', dot: 'bg-amber-400', bar: 'from-amber-600 to-amber-400', text: 'text-amber-400' },
  normal: { label: 'Normal training', dot: 'bg-sky-400', bar: 'from-sky-600 to-sky-400', text: 'text-sky-400' },
  push: { label: 'Push hard', dot: 'bg-emerald-400', bar: 'from-emerald-600 to-emerald-400', text: 'text-emerald-400' },
}

const bmiColorMap = {
  emerald: { zone: 'text-emerald-400', bar: 'from-emerald-600 to-teal-500', ring: 'border-emerald-500/30' },
  amber: { zone: 'text-amber-400', bar: 'from-amber-500 to-yellow-400', ring: 'border-amber-500/30' },
  rose: { zone: 'text-rose-400', bar: 'from-rose-600 to-rose-400', ring: 'border-rose-500/30' },
}

function TargetTile({
  icon,
  label,
  value,
  sub,
  done,
  total,
  color = 'text-white',
  barColor = 'bg-sky-500',
}: {
  icon: string
  label: string
  value: string
  sub?: string
  done?: number
  total?: number
  color?: string
  barColor?: string
}) {
  const pct = done != null && total != null && total > 0 ? Math.min(done / total, 1) : null
  return (
    <div className="rounded-xl bg-slate-900/50 border border-slate-700/50 p-3">
      <div className="flex items-start justify-between gap-1 mb-1">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 leading-snug">{label}</p>
        <span className="text-base shrink-0">{icon}</span>
      </div>
      <p className={`text-lg font-bold tabular-nums ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
      {pct != null && (
        <div className="mt-2 h-1.5 rounded-full bg-slate-700/80 overflow-hidden">
          <div
            className={`h-full rounded-full ${barColor} transition-all duration-500`}
            style={{ width: `${pct * 100}%` }}
          />
        </div>
      )}
      {done != null && total != null && (
        <p className="text-[10px] text-slate-600 mt-0.5">{done}/{total} done</p>
      )}
    </div>
  )
}

export default function DailyTargetsPanel({ targets, weekStrengthDone, weekCardioDone }: Props) {
  const ic = intensityConfig[targets.trainingIntensity]
  const bc = bmiColorMap[targets.bmiColor]

  // BMI scale: position current on 15–40 scale
  const bmiBarPct =
    targets.bmi != null
      ? Math.min(Math.max(((targets.bmi - 15) / (40 - 15)) * 100, 0), 100)
      : null

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-6 shadow-xl shadow-black/20">
      <div className="pointer-events-none absolute -right-10 -bottom-10 h-44 w-44 rounded-full bg-sky-500/6 blur-3xl" />

      <h2 className="text-lg font-semibold text-slate-100 tracking-tight mb-5">Daily & Weekly Targets</h2>

      {/* BMI section */}
      <div className={`rounded-xl border ${bc.ring} bg-slate-900/40 p-4 mb-5`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">BMI</p>
            {targets.bmi != null ? (
              <>
                <p className={`text-4xl font-extrabold tabular-nums ${bc.zone}`}>
                  {targets.bmi}
                </p>
                <p className={`text-sm font-medium mt-0.5 ${bc.zone}`}>{targets.bmiCategory}</p>
              </>
            ) : (
              <>
                <p className="text-slate-400 text-sm mt-1">No height logged</p>
                <Link href="/weight" className="text-indigo-400 text-xs hover:text-indigo-300">
                  Add height on Weight page →
                </Link>
              </>
            )}
          </div>
          {targets.lbsToHealthyBmi != null && targets.lbsToHealthyBmi > 0 && (
            <div className="text-right">
              <p className="text-xs text-slate-500 mb-0.5">To reach BMI 24.9</p>
              <p className="text-2xl font-bold text-amber-300 tabular-nums">
                −{targets.lbsToHealthyBmi} lb
              </p>
              {targets.weightAtBmi25 != null && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Target ≈ {targets.weightAtBmi25} lb
                </p>
              )}
              {targets.weightAtBmi22 != null && (
                <p className="text-xs text-slate-600">
                  Ideal mid ≈ {targets.weightAtBmi22} lb
                </p>
              )}
            </div>
          )}
          {targets.lbsToHealthyBmi === 0 && targets.bmi != null && (
            <div className="text-right">
              <p className="text-emerald-400 text-sm font-medium">In healthy range ✓</p>
              {targets.weightAtBmi22 != null && (
                <p className="text-xs text-slate-500 mt-1">Mid-range ≈ {targets.weightAtBmi22} lb</p>
              )}
            </div>
          )}
        </div>

        {/* BMI bar */}
        {bmiBarPct != null && (
          <div className="mt-4">
            <div className="relative h-3 rounded-full bg-slate-700/80 overflow-hidden">
              {/* Zone markers */}
              <div className="absolute inset-0 flex">
                <div className="bg-amber-500/20" style={{ width: `${((18.5-15)/25)*100}%` }} />
                <div className="bg-emerald-500/20" style={{ width: `${((25-18.5)/25)*100}%` }} />
                <div className="bg-amber-500/20" style={{ width: `${((30-25)/25)*100}%` }} />
                <div className="flex-1 bg-rose-500/20" />
              </div>
              {/* Current position marker */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white rounded-full shadow-lg"
                style={{ left: `calc(${bmiBarPct}% - 2px)` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-600 mt-1">
              <span>15</span>
              <span className="text-amber-500/70">18.5</span>
              <span className="text-emerald-500/70">25</span>
              <span className="text-amber-500/70">30</span>
              <span>40</span>
            </div>
          </div>
        )}

        {/* BMI progress toward healthy */}
        {targets.bmiProgressPct != null && targets.lbsToHealthyBmi != null && targets.lbsToHealthyBmi > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-[11px] text-slate-500 mb-1">
              <span>Progress to BMI 24.9</span>
              <span className={bc.zone}>{targets.bmiProgressPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-700/80 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${bc.bar} transition-all duration-700`}
                style={{ width: `${targets.bmiProgressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Today's intensity badge */}
      <div className={`rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3 mb-5`}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`inline-block w-2 h-2 rounded-full ${ic.dot}`} />
          <p className={`text-sm font-semibold ${ic.text}`}>{ic.label}</p>
        </div>
        <p className="text-slate-400 text-xs">{targets.trainingReason}</p>
      </div>

      {/* Target tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-5">
        <TargetTile
          icon="🔥"
          label="Daily calories"
          value={`${targets.caloriesTarget}`}
          sub={`TDEE ${targets.tdee} − ${Math.round(targets.deficit)} deficit`}
          color="text-orange-300"
        />
        <TargetTile
          icon="🥩"
          label="Daily protein"
          value={`≥${targets.proteinG}g`}
          sub="preserves muscle in deficit"
          color="text-sky-300"
        />
        <TargetTile
          icon="🫀"
          label="Daily carbs / fat"
          value={`${targets.carbsG}g / ${targets.fatG}g`}
          sub="carbs fuel training"
          color="text-violet-300"
        />
        <TargetTile
          icon="👟"
          label="Daily steps"
          value={targets.stepsGoal.toLocaleString()}
          sub="NEAT + calorie deficit"
          color="text-teal-300"
        />
        <TargetTile
          icon="🏋️"
          label="Strength / week"
          value={`${weekStrengthDone} / ${targets.strengthPerWeek}`}
          sub="done this week"
          done={weekStrengthDone}
          total={targets.strengthPerWeek}
          color="text-amber-300"
          barColor="bg-amber-500"
        />
        <TargetTile
          icon="🚴"
          label="Cardio / week"
          value={`${weekCardioDone} / ${targets.cardioPerWeek}`}
          sub="done this week"
          done={weekCardioDone}
          total={targets.cardioPerWeek}
          color="text-emerald-300"
          barColor="bg-emerald-500"
        />
      </div>

      {/* Sleep target */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3 mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Sleep target</p>
          <p className="text-slate-200 font-semibold mt-0.5">
            {targets.sleepHoursMin}–{targets.sleepHoursTarget}h per night
          </p>
          <p className="text-slate-600 text-xs mt-0.5">Quality sleep supports recovery and fat loss</p>

        </div>
        <span className="text-3xl">🌙</span>
      </div>

      {/* Today's focus checklist */}
      <div>
        <p className="text-xs uppercase tracking-wider text-slate-500 mb-2.5">Today&apos;s focus</p>
        <ul className="space-y-2">
          {targets.todayFocus.map((item, i) => (
            <li key={i} className="flex gap-2 text-xs text-slate-400 leading-snug">
              <span className="text-slate-600 mt-0.5 shrink-0">→</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
