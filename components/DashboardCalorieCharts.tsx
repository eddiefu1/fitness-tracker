'use client'

import { useMemo, useEffect, useState } from 'react'
import type { FoodEntry, WeightEntry } from '@/lib/storage'
import {
  buildCurrentWeekSunSatSummary,
  buildDailyCalorieSeries,
} from '@/lib/calorieAnalytics'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

type Props = {
  food: FoodEntry[]
  weights: WeightEntry[]
}

const axisStyle = { fill: '#94a3b8', fontSize: 11 }
const gridStyle = { stroke: '#334155' }

export default function DashboardCalorieCharts({ food, weights }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const series = useMemo(
    () => buildDailyCalorieSeries(food, weights, 14),
    [food, weights]
  )

  const week = useMemo(
    () => buildCurrentWeekSunSatSummary(food, weights),
    [food, weights]
  )

  const chartData = useMemo(
    () =>
      series.map((d) => ({
        ...d,
        within: Math.min(d.calories, d.target),
        over: Math.max(0, d.calories - d.target),
      })),
    [series]
  )

  const weekPct =
    week.totalTargetBudget > 0
      ? Math.min((week.totalCalories / week.totalTargetBudget) * 100, 100)
      : 0
  const weekOver = week.surplusVsBudget > 0

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-800/95 via-slate-900/90 to-slate-950 p-6 shadow-xl shadow-black/20">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-100 tracking-tight">
              This week vs budget
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Sun–Sat · sum of daily targets (each day uses TDEE from your weight then)
            </p>
          </div>
          <div className="text-right">
            <p
              className={`text-3xl font-bold tabular-nums ${
                weekOver ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {Math.round(week.totalCalories)}
              <span className="text-slate-500 text-lg font-normal"> / </span>
              <span className="text-slate-200">{Math.round(week.totalTargetBudget)}</span>
            </p>
            <p className="text-slate-500 text-xs mt-1">kcal eaten · kcal budget</p>
          </div>
        </div>

        <div className="mb-5">
          <div className="h-4 rounded-full bg-slate-700/80 overflow-hidden ring-1 ring-slate-600/50">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                weekOver
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-500'
              }`}
              style={{ width: `${weekPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>
              {weekOver
                ? `Over budget by ${Math.round(week.surplusVsBudget)} kcal`
                : `Under budget by ${Math.round(-week.surplusVsBudget)} kcal`}
            </span>
            <span>
              {week.daysOverTarget} day{week.daysOverTarget === 1 ? '' : 's'} over daily target
            </span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {week.days.map((d) => (
            <div
              key={d.dateKey}
              className={`rounded-xl px-1 py-2 text-center border ${
                d.over
                  ? 'bg-rose-950/40 border-rose-500/30'
                  : 'bg-slate-900/50 border-slate-600/40'
              }`}
            >
              <p className="text-[10px] sm:text-xs text-slate-500 truncate">{d.label}</p>
              <p className="text-xs sm:text-sm font-semibold text-slate-200 mt-1 tabular-nums">
                {Math.round(d.calories)}
              </p>
              <p className="text-[10px] text-slate-500 tabular-nums">/ {d.target}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-800/95 to-slate-950 p-6 shadow-xl shadow-black/20">
        <h2 className="text-lg font-semibold text-slate-100 mb-1">14-day intake</h2>
        <p className="text-slate-500 text-sm mb-4">
          Stacked: green = up to target · red = above target · line = daily target (moves with weight)
        </p>
        <div className="h-[280px] w-full min-w-0">
          {!mounted ? (
            <div className="h-full w-full rounded-xl bg-slate-900/50 animate-pulse ring-1 ring-slate-700/50" />
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStyle.stroke} vertical={false} />
              <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} interval={0} angle={-35} textAnchor="end" height={56} />
              <YAxis
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
                width={44}
                label={{ value: 'kcal', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#e2e8f0' }}
                formatter={(value) =>
                  typeof value === 'number' ? Math.round(value) : value
                }
                labelFormatter={(_, payload) => {
                  const p = payload?.[0]?.payload as { dateKey?: string } | undefined
                  return p?.dateKey ?? ''
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
              <Bar
                dataKey="within"
                stackId="a"
                fill="#10b981"
                name="Within daily target"
                radius={[0, 0, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                dataKey="over"
                stackId="a"
                fill="#f43f5e"
                name="Over daily target"
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="#fbbf24"
                strokeWidth={2}
                dot={{ r: 2, fill: '#fbbf24' }}
                name="Daily target (weight-based)"
              />
            </ComposedChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
