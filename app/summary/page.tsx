'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { storage } from '@/lib/storage'
import {
  buildWeightLossSummary,
  GOAL_WEIGHT_HIGH_LB,
  GOAL_WEIGHT_LOW_LB,
  START_WEIGHT_LB,
} from '@/lib/weightLossSummary'

export default function SummaryPage() {
  const [tick, setTick] = useState(0)

  const weekAgo = () => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d
  }

  const buildWeekSlice = useCallback(() => {
    const wa = weekAgo()
    return {
      workouts: storage.getWorkouts().filter((w) => new Date(w.date) >= wa),
      food: storage.getFoodEntries().filter((f) => new Date(f.date) >= wa),
      sleep: storage.getSleepEntries().filter((s) => new Date(s.date) >= wa),
      weight: storage.getWeightEntries().filter((w) => new Date(w.date) >= wa),
    }
  }, [])

  const blocks = useMemo(() => {
    void tick
    const week = buildWeekSlice()
    return buildWeightLossSummary(week, storage.getWeightEntries())
  }, [tick, buildWeekSlice])

  useEffect(() => {
    const onFocus = () => setTick((t) => t + 1)
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const week = buildWeekSlice()
  const totalCal = week.food.reduce((s, e) => s + e.calories, 0)
  const sleepQ =
    week.sleep.length > 0
      ? week.sleep.reduce((a, e) => a + e.quality, 0) / week.sleep.length
      : 0

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Weekly Summary</h1>
          <p className="text-slate-400 mt-1">
            Start:{' '}
            <span className="text-slate-200 font-medium">{START_WEIGHT_LB} lb</span>
            {' → '}
            goal{' '}
            <span className="text-slate-200 font-medium">
              {GOAL_WEIGHT_LOW_LB}–{GOAL_WEIGHT_HIGH_LB} lb
            </span>
            — baselines and how your week lines up.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setTick((t) => t + 1)}
          className="shrink-0 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium border border-slate-600 transition-colors"
        >
          Refresh from logs
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 text-center">
          <p className="text-2xl font-bold text-blue-400">{week.workouts.length}</p>
          <p className="text-slate-400 text-xs mt-1">Workouts (7d)</p>
        </div>
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 text-center">
          <p className="text-2xl font-bold text-purple-400">
            {week.sleep.length > 0 ? sleepQ.toFixed(1) : '—'}
          </p>
          <p className="text-slate-400 text-xs mt-1">Avg sleep quality</p>
        </div>
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 text-center">
          <p className="text-2xl font-bold text-green-400">{Math.round(totalCal)}</p>
          <p className="text-slate-400 text-xs mt-1">Calories logged (7d)</p>
        </div>
      </div>

      <div className="space-y-6">
        {blocks.map((b) => (
          <div
            key={b.title}
            className="bg-slate-800 rounded-2xl p-6 border border-slate-700"
          >
            <h2 className="text-lg font-semibold text-slate-200 mb-3">{b.title}</h2>
            <div className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">
              {b.content}
            </div>
          </div>
        ))}
      </div>

      <p className="text-slate-500 text-xs mt-8">
        This is educational guidance only, not medical advice. Adjust targets with a
        registered dietitian or physician if you have health conditions.
      </p>
    </div>
  )
}
