'use client'
import { useState, useEffect } from 'react'
import { storage, WorkoutEntry } from '@/lib/storage'

const WORKOUT_TYPES = ['Running', 'Cycling', 'Swimming', 'Weight Training', 'Yoga', 'HIIT', 'Walking', 'Other']

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([])
  const [form, setForm] = useState({
    type: 'Running',
    duration: '',
    caloriesBurned: '',
    notes: '',
  })

  useEffect(() => {
    setWorkouts(storage.getWorkouts())
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const entry: WorkoutEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      type: form.type,
      duration: Number(form.duration),
      caloriesBurned: Number(form.caloriesBurned),
      notes: form.notes,
    }
    storage.saveWorkout(entry)
    setWorkouts(storage.getWorkouts())
    setForm({ type: 'Running', duration: '', caloriesBurned: '', notes: '' })
  }

  const handleDelete = (id: string) => {
    storage.deleteWorkout(id)
    setWorkouts(storage.getWorkouts())
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Workouts 💪</h1>
        <p className="text-slate-400 mt-1">Log your exercise sessions</p>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6">
        <h2 className="text-lg font-semibold text-slate-300 mb-4">Log Workout</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Type</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                {WORKOUT_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Duration (minutes)</label>
              <input
                type="number"
                min="1"
                required
                value={form.duration}
                onChange={e => setForm({ ...form, duration: e.target.value })}
                placeholder="30"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Calories Burned</label>
              <input
                type="number"
                min="0"
                required
                value={form.caloriesBurned}
                onChange={e => setForm({ ...form, caloriesBurned: e.target.value })}
                placeholder="300"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Notes</label>
              <input
                type="text"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes..."
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            Log Workout
          </button>
        </form>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-slate-300 mb-4">Workout History ({workouts.length})</h2>
        {workouts.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No workouts logged yet. Add your first one above!</p>
        ) : (
          <div className="space-y-3">
            {workouts.map(w => (
              <div key={w.id} className="bg-slate-700 rounded-xl p-4 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-semibold">{w.type}</span>
                    <span className="text-xs bg-blue-600/30 text-blue-400 px-2 py-0.5 rounded-full">{w.duration} min</span>
                    <span className="text-xs bg-orange-600/30 text-orange-400 px-2 py-0.5 rounded-full">{w.caloriesBurned} kcal</span>
                  </div>
                  <p className="text-slate-400 text-sm">{new Date(w.date).toLocaleString()}</p>
                  {w.notes && <p className="text-slate-300 text-sm mt-1">{w.notes}</p>}
                </div>
                <button
                  onClick={() => handleDelete(w.id)}
                  className="text-slate-500 hover:text-red-400 transition-colors ml-2 p-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
