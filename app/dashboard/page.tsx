'use client'
import { useState, useEffect } from 'react'
import { storage, WorkoutEntry, FoodEntry, SleepEntry } from '@/lib/storage'
import { inferWorkoutCategory } from '@/lib/workoutUtils'
import { calculateWellnessScore } from '@/lib/wellness'
import WellnessScore from '@/components/WellnessScore'
import CalorieProgress from '@/components/CalorieProgress'

export default function DashboardPage() {
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([])
  const [food, setFood] = useState<FoodEntry[]>([])
  const [sleep, setSleep] = useState<SleepEntry[]>([])

  useEffect(() => {
    setWorkouts(storage.getWorkouts())
    setFood(storage.getFoodEntries())
    setSleep(storage.getSleepEntries())
  }, [])

  const score = calculateWellnessScore(workouts, food, sleep)

  const today = new Date().toISOString().split('T')[0]
  const todayWorkouts = workouts.filter(w => w.date.startsWith(today))
  const thisWeek = new Date()
  thisWeek.setDate(thisWeek.getDate() - 6)
  const weekWorkouts = workouts.filter(w => new Date(w.date) >= thisWeek)
  const weekStrength = weekWorkouts.filter(w => inferWorkoutCategory(w) === 'strength').length
  const weekCardio = weekWorkouts.filter(w => inferWorkoutCategory(w) === 'cardio').length

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <WellnessScore score={score} />
        <CalorieProgress entries={food} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-slate-300 font-medium">Workouts This Week</h3>
            <span className="text-2xl">💪</span>
          </div>
          <p className="text-3xl font-bold text-blue-400">{weekWorkouts.length}</p>
          <p className="text-slate-400 text-sm mt-1">
            {weekStrength} strength · {weekCardio} cardio
          </p>
        </div>
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-slate-300 font-medium">Calories Burned Today</h3>
            <span className="text-2xl">🔥</span>
          </div>
          <p className="text-3xl font-bold text-orange-400">
            {todayWorkouts.reduce((s, w) => s + w.caloriesBurned, 0)}
          </p>
          <p className="text-slate-400 text-sm mt-1">kcal from exercise</p>
        </div>
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-slate-300 font-medium">Avg Sleep Quality</h3>
            <span className="text-2xl">😴</span>
          </div>
          <p className="text-3xl font-bold text-purple-400">
            {sleep.length > 0
              ? (sleep.slice(0, 7).reduce((s, e) => s + e.quality, 0) / Math.min(sleep.length, 7)).toFixed(1)
              : '—'}
          </p>
          <p className="text-slate-400 text-sm mt-1">out of 10</p>
        </div>
      </div>

      {weekWorkouts.length > 0 && (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-slate-300 mb-4">Recent Workouts</h2>
          <div className="space-y-2">
            {weekWorkouts.slice(0, 5).map(w => (
              <div key={w.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                <div>
                  <p className="text-white font-medium">
                    <span className={`text-xs mr-2 px-1.5 py-0.5 rounded ${inferWorkoutCategory(w) === 'strength' ? 'bg-amber-600/30 text-amber-300' : 'bg-cyan-600/30 text-cyan-300'}`}>
                      {inferWorkoutCategory(w) === 'strength' ? 'S' : 'C'}
                    </span>
                    {w.type}
                  </p>
                  <p className="text-slate-400 text-sm">{new Date(w.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-blue-400">{w.duration} min</p>
                  <p className="text-slate-400 text-sm">{w.caloriesBurned} kcal</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
