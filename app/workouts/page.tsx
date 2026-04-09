'use client'

import { useState, useEffect, useMemo } from 'react'
import { storage, WorkoutEntry, WorkoutCategory, ExerciseLine } from '@/lib/storage'
import {
  inferWorkoutCategory,
  categoryLabel,
  categoryBadgeClass,
} from '@/lib/workoutUtils'

const STRENGTH_TYPES = [
  'Upper body',
  'Lower body',
  'Push',
  'Pull',
  'Full body',
  'Core',
  'Arms',
  'Weight Training',
  'Other',
]

const CARDIO_TYPES = [
  'Running',
  'Cycling',
  'Swimming',
  'Walking',
  'Elliptical',
  'HIIT',
  'Rowing',
  'Stair climber',
  'Other',
]

type ExerciseRow = { name: string; detail: string }

const emptyRow = (): ExerciseRow => ({ name: '', detail: '' })

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([])
  const [category, setCategory] = useState<WorkoutCategory>('strength')
  const [type, setType] = useState(STRENGTH_TYPES[0])
  const [duration, setDuration] = useState('')
  const [caloriesBurned, setCaloriesBurned] = useState('')
  const [notes, setNotes] = useState('')
  const [exerciseRows, setExerciseRows] = useState<ExerciseRow[]>([emptyRow()])
  const [historyFilter, setHistoryFilter] = useState<'all' | WorkoutCategory>('all')

  useEffect(() => {
    setWorkouts(storage.getWorkouts())
  }, [])

  const sessionOptions = category === 'strength' ? STRENGTH_TYPES : CARDIO_TYPES

  useEffect(() => {
    const opts = category === 'strength' ? STRENGTH_TYPES : CARDIO_TYPES
    if (!opts.includes(type)) setType(opts[0])
  }, [category, type])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const lines: ExerciseLine[] = exerciseRows
      .filter((r) => r.name.trim())
      .map((r) => ({
        name: r.name.trim(),
        detail: r.detail.trim() || undefined,
      }))

    const entry: WorkoutEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      category,
      type,
      duration: Number(duration),
      caloriesBurned: Number(caloriesBurned),
      notes: notes.trim(),
      exercises: lines.length > 0 ? lines : undefined,
    }
    storage.saveWorkout(entry)
    setWorkouts(storage.getWorkouts())
    setDuration('')
    setCaloriesBurned('')
    setNotes('')
    setExerciseRows([emptyRow()])
  }

  const handleDelete = (id: string) => {
    storage.deleteWorkout(id)
    setWorkouts(storage.getWorkouts())
  }

  const addExerciseRow = () =>
    setExerciseRows((rows) => [...rows, emptyRow()])

  const updateExerciseRow = (i: number, field: keyof ExerciseRow, value: string) => {
    setExerciseRows((rows) =>
      rows.map((r, j) => (j === i ? { ...r, [field]: value } : r))
    )
  }

  const removeExerciseRow = (i: number) => {
    setExerciseRows((rows) =>
      rows.length <= 1 ? [emptyRow()] : rows.filter((_, j) => j !== i)
    )
  }

  const filteredHistory = useMemo(() => {
    if (historyFilter === 'all') return workouts
    return workouts.filter((w) => inferWorkoutCategory(w) === historyFilter)
  }, [workouts, historyFilter])

  const weekStrength = useMemo(
    () =>
      workouts.filter(
        (w) =>
          new Date(w.date) >= weekStart() &&
          inferWorkoutCategory(w) === 'strength'
      ).length,
    [workouts]
  )
  const weekCardio = useMemo(
    () =>
      workouts.filter(
        (w) =>
          new Date(w.date) >= weekStart() &&
          inferWorkoutCategory(w) === 'cardio'
      ).length,
    [workouts]
  )

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Workouts 💪</h1>
        <p className="text-slate-400 mt-1">
          Log strength and cardio separately. Add exercises (sets, reps, or intervals) for each session.
        </p>
        <p className="text-slate-500 text-sm mt-2">
          This week:{' '}
          <span className="text-amber-400">Strength {weekStrength}</span>
          {' · '}
          <span className="text-cyan-400">Cardio {weekCardio}</span>
        </p>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6">
        <h2 className="text-lg font-semibold text-slate-300 mb-4">Log workout</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-slate-400 self-center mr-2">Category</span>
            {(['strength', 'cardio'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  category === c
                    ? c === 'strength'
                      ? 'bg-amber-600 text-white'
                      : 'bg-cyan-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {categoryLabel(c)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Session type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                {sessionOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Duration (minutes)</label>
              <input
                type="number"
                min="1"
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="45"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Calories burned</label>
              <input
                type="number"
                min="0"
                required
                value={caloriesBurned}
                onChange={(e) => setCaloriesBurned(e.target.value)}
                placeholder="300"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Session notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Warm-up, how it felt, etc."
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="border border-slate-600 rounded-xl p-4 bg-slate-800/50">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-300">
                Exercises{' '}
                <span className="text-slate-500 font-normal">
                  ({category === 'strength' ? 'e.g. 3×10 @ 135 lb' : 'e.g. intervals or distance'})
                </span>
              </label>
              <button
                type="button"
                onClick={addExerciseRow}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                + Add exercise
              </button>
            </div>
            <div className="space-y-2">
              {exerciseRows.map((row, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => updateExerciseRow(i, 'name', e.target.value)}
                    placeholder={category === 'strength' ? 'Bench press' : 'Treadmill'}
                    className="flex-1 min-w-0 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500"
                  />
                  <input
                    type="text"
                    value={row.detail}
                    onChange={(e) => updateExerciseRow(i, 'detail', e.target.value)}
                    placeholder={category === 'strength' ? '3×10 @ 135 lb' : '30 min @ zone 2'}
                    className="flex-1 min-w-0 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeExerciseRow(i)}
                    className="text-slate-500 hover:text-red-400 px-2 py-2 text-sm shrink-0"
                    aria-label="Remove row"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            Log workout
          </button>
        </form>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-slate-300">
            History ({filteredHistory.length}
            {historyFilter !== 'all' ? ` / ${workouts.length} total` : ''})
          </h2>
          <div className="flex flex-wrap gap-2">
            {(['all', 'strength', 'cardio'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setHistoryFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  historyFilter === f
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-700/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {f === 'all' ? 'All' : categoryLabel(f)}
              </button>
            ))}
          </div>
        </div>
        {filteredHistory.length === 0 ? (
          <p className="text-slate-400 text-center py-8">
            {workouts.length === 0
              ? 'No workouts logged yet. Add your first one above!'
              : 'Nothing in this filter.'}
          </p>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((w) => {
              const cat = inferWorkoutCategory(w)
              return (
                <div
                  key={w.id}
                  className="bg-slate-700 rounded-xl p-4 flex items-start justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${categoryBadgeClass(cat)}`}
                      >
                        {categoryLabel(cat)}
                      </span>
                      <span className="text-white font-semibold">{w.type}</span>
                      <span className="text-xs bg-blue-600/30 text-blue-400 px-2 py-0.5 rounded-full">
                        {w.duration} min
                      </span>
                      <span className="text-xs bg-orange-600/30 text-orange-400 px-2 py-0.5 rounded-full">
                        {w.caloriesBurned} kcal
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm">
                      {new Date(w.date).toLocaleString()}
                    </p>
                    {w.exercises && w.exercises.length > 0 && (
                      <ul className="mt-2 space-y-1 text-sm text-slate-300 border-l-2 border-slate-600 pl-3">
                        {w.exercises.map((ex, i) => (
                          <li key={i}>
                            <span className="text-emerald-400/90">{ex.name}</span>
                            {ex.detail && (
                              <span className="text-slate-400"> — {ex.detail}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    {w.notes && (
                      <p className="text-slate-400 text-sm mt-2 italic">{w.notes}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(w.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1 shrink-0"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function weekStart(): Date {
  const d = new Date()
  d.setDate(d.getDate() - 6)
  d.setHours(0, 0, 0, 0)
  return d
}
