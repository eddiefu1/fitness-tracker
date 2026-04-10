'use client'
import { useMemo, useState, useEffect } from 'react'
import { storage, WorkoutEntry, FoodEntry, WeightEntry, StepEntry } from '@/lib/storage'
import { inferWorkoutCategory } from '@/lib/workoutUtils'
import { calculateWellnessScore } from '@/lib/wellness'
import { extractLatestWhoopMetrics } from '@/lib/whoopMetrics'
import { computeDailyTargets } from '@/lib/dailyTargets'
import { localDateKey, parseEntryDateMs } from '@/lib/dateHelpers'
import { isSundayMorningWindow } from '@/lib/weekBounds'
import { getDailyCalorieTarget } from '@/lib/calorieTarget'
import { sumStepsByDateKey } from '@/lib/stepsSeries'
import WellnessScore from '@/components/WellnessScore'
import CalorieProgress from '@/components/CalorieProgress'
import DashboardCalorieCharts from '@/components/DashboardCalorieCharts'
import WeeklyCheckInCard from '@/components/WeeklyCheckInCard'
import TargetWeightCard from '@/components/TargetWeightCard'
import WhoopMetricsPanel from '@/components/WhoopMetricsPanel'
import DailyTargetsPanel from '@/components/DailyTargetsPanel'
import type { WhoopStoredData } from '@/lib/whoop/types'

export default function DashboardPage() {
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([])
  const [food, setFood] = useState<FoodEntry[]>([])
  const [weights, setWeights] = useState<WeightEntry[]>([])
  const [steps, setSteps] = useState<StepEntry[]>([])
  const [whoopData, setWhoopData] = useState<WhoopStoredData | null>(null)
  const [heightInches, setHeightInches] = useState<number | null>(null)

  useEffect(() => {
    setWorkouts(storage.getWorkouts())
    setFood(storage.getFoodEntries())
    setWeights(storage.getWeightEntries())
    setSteps(storage.getStepEntries())
    setWhoopData(storage.getWhoopData())
    const h = storage.getProfile().heightInches
    setHeightInches(typeof h === 'number' && h > 0 ? h : null)
  }, [])

  const latestWeightLb = useMemo(() => {
    const sorted = [...weights].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    const w = sorted[0]?.weight
    return w != null && w > 0 ? w : null
  }, [weights])

  const calorieGoal = getDailyCalorieTarget(latestWeightLb)
  const whoopMetrics = useMemo(() => extractLatestWhoopMetrics(whoopData), [whoopData])
  const score = useMemo(
    () => calculateWellnessScore(workouts, food, calorieGoal, whoopMetrics, steps),
    [workouts, food, calorieGoal, whoopMetrics, steps]
  )

  const todayKey = localDateKey(Date.now())
  const todayWorkouts = workouts.filter(
    (w) => localDateKey(parseEntryDateMs(w.date)) === todayKey
  )

  const todaySteps = useMemo(() => {
    const byDay = sumStepsByDateKey(steps)
    return byDay.get(todayKey) ?? 0
  }, [steps, todayKey])

  const sundayHighlight = isSundayMorningWindow()
  const thisWeek = new Date()
  thisWeek.setDate(thisWeek.getDate() - 6)
  const weekWorkouts = workouts.filter((w) => new Date(w.date) >= thisWeek)
  const weekStrength = weekWorkouts.filter((w) => inferWorkoutCategory(w) === 'strength').length
  const weekCardio = weekWorkouts.filter((w) => inferWorkoutCategory(w) === 'cardio').length

  const dailyTargets = useMemo(
    () => computeDailyTargets(latestWeightLb, heightInches, whoopMetrics, weekStrength, weekCardio),
    [latestWeightLb, heightInches, whoopMetrics, weekStrength, weekCardio]
  )

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        {sundayHighlight && (
          <p className="text-indigo-300 text-sm mt-2">
            Sunday check-in: review last week below and your full summary on the Weekly Summary page.
          </p>
        )}
      </div>

      <WeeklyCheckInCard emphasizeSunday={sundayHighlight} />

      <div className="mb-6">
        <TargetWeightCard weights={weights} />
      </div>

      {/* Wellness score + WHOOP panel */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <WellnessScore score={score} />
        <WhoopMetricsPanel metrics={whoopMetrics} />
      </div>

      {/* BMI + daily targets panel */}
      <div className="mb-6">
        <DailyTargetsPanel
          targets={dailyTargets}
          weekStrengthDone={weekStrength}
          weekCardioDone={weekCardio}
        />
      </div>

      {/* Calorie ring + chart */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <CalorieProgress entries={food} latestWeightLb={latestWeightLb} />

        {/* Activity + Steps quick stats */}
        <div className="grid grid-rows-2 gap-4">
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="Workouts this week"
              value={weekWorkouts.length}
              sub={`${weekStrength} strength · ${weekCardio} cardio`}
              icon="💪"
              valueClass="text-blue-400"
            />
            <StatCard
              label="Calories burned today"
              value={todayWorkouts.reduce((s, w) => s + w.caloriesBurned, 0)}
              sub="kcal from exercise"
              icon="🔥"
              valueClass="text-orange-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="Steps today"
              value={todaySteps.toLocaleString()}
              sub={`${Math.round((todaySteps / 10000) * 100)}% of 10k goal`}
              icon="👟"
              valueClass="text-sky-400"
            />
            <StatCard
              label="WHOOP workouts (7d)"
              value={whoopMetrics.whoopWorkouts7d}
              sub={
                whoopMetrics.avgRecovery7d != null
                  ? `Avg recovery ${whoopMetrics.avgRecovery7d}`
                  : 'sync WHOOP to update'
              }
              icon="⌚"
              valueClass="text-indigo-400"
            />
          </div>
        </div>
      </div>

      {/* Calorie analytics charts */}
      <div className="mb-6">
        <DashboardCalorieCharts food={food} weights={weights} />
      </div>

      {/* Recent workouts */}
      {weekWorkouts.length > 0 && (
        <div className="rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Recent workouts</h2>
          <div className="space-y-2">
            {weekWorkouts.slice(0, 5).map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between py-2 border-b border-slate-700/60 last:border-0"
              >
                <div>
                  <p className="text-white font-medium">
                    <span
                      className={`text-xs mr-2 px-1.5 py-0.5 rounded ${
                        inferWorkoutCategory(w) === 'strength'
                          ? 'bg-amber-600/30 text-amber-300'
                          : 'bg-cyan-600/30 text-cyan-300'
                      }`}
                    >
                      {inferWorkoutCategory(w) === 'strength' ? 'S' : 'C'}
                    </span>
                    {w.type}
                  </p>
                  <p className="text-slate-400 text-sm">{new Date(w.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-blue-400">{w.duration} min</p>
                  <p className="text-slate-500 text-sm">{w.caloriesBurned} kcal</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  icon,
  valueClass = 'text-white',
}: {
  label: string
  value: string | number
  sub?: string
  icon: string
  valueClass?: string
}) {
  return (
    <div className="rounded-2xl border border-slate-700/70 bg-gradient-to-br from-slate-800 to-slate-900 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-slate-400 text-xs font-medium leading-snug">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className={`text-2xl font-bold tabular-nums ${valueClass}`}>{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}
