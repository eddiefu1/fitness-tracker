'use client'
import { useState, useEffect } from 'react'
import { storage, SleepEntry } from '@/lib/storage'

export default function SleepPage() {
  const [entries, setEntries] = useState<SleepEntry[]>([])
  const [form, setForm] = useState({
    hours: '',
    quality: '7',
    bedtime: '',
    wakeTime: '',
  })

  useEffect(() => {
    setEntries(storage.getSleepEntries())
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const entry: SleepEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      hours: Number(form.hours),
      quality: Number(form.quality),
      bedtime: form.bedtime,
      wakeTime: form.wakeTime,
    }
    storage.saveSleepEntry(entry)
    setEntries(storage.getSleepEntries())
    setForm({ hours: '', quality: '7', bedtime: '', wakeTime: '' })
  }

  const handleDelete = (id: string) => {
    storage.deleteSleepEntry(id)
    setEntries(storage.getSleepEntries())
  }

  const avgQuality = entries.length > 0
    ? (entries.slice(0, 7).reduce((s, e) => s + e.quality, 0) / Math.min(entries.length, 7)).toFixed(1)
    : null

  const avgHours = entries.length > 0
    ? (entries.slice(0, 7).reduce((s, e) => s + e.hours, 0) / Math.min(entries.length, 7)).toFixed(1)
    : null

  const qualityColor = (q: number) => {
    if (q >= 8) return 'text-green-400'
    if (q >= 5) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Sleep Tracker 😴</h1>
        <p className="text-slate-400 mt-1">Monitor your sleep patterns</p>
      </div>

      {avgQuality && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 text-center">
            <p className={`text-4xl font-bold ${qualityColor(Number(avgQuality))}`}>{avgQuality}</p>
            <p className="text-slate-400 text-sm mt-1">Avg Quality (7-day)</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 text-center">
            <p className="text-4xl font-bold text-purple-400">{avgHours}h</p>
            <p className="text-slate-400 text-sm mt-1">Avg Duration (7-day)</p>
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6">
        <h2 className="text-lg font-semibold text-slate-300 mb-4">Log Sleep</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Hours Slept</label>
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                required
                value={form.hours}
                onChange={e => setForm({ ...form, hours: e.target.value })}
                placeholder="8"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Quality (1-10): {form.quality}</label>
              <input
                type="range"
                min="1"
                max="10"
                value={form.quality}
                onChange={e => setForm({ ...form, quality: e.target.value })}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Poor</span>
                <span>Excellent</span>
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Bedtime</label>
              <input
                type="time"
                value={form.bedtime}
                onChange={e => setForm({ ...form, bedtime: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Wake Time</label>
              <input
                type="time"
                value={form.wakeTime}
                onChange={e => setForm({ ...form, wakeTime: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            Log Sleep
          </button>
        </form>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-slate-300 mb-4">Sleep History ({entries.length})</h2>
        {entries.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No sleep logged yet.</p>
        ) : (
          <div className="space-y-3">
            {entries.map(e => (
              <div key={e.id} className="bg-slate-700 rounded-xl p-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-semibold">{e.hours} hours</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-purple-600/30 ${qualityColor(e.quality)}`}>
                      Quality: {e.quality}/10
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm">{new Date(e.date).toLocaleDateString()}</p>
                  {(e.bedtime || e.wakeTime) && (
                    <p className="text-slate-400 text-sm">
                      {e.bedtime && `Bed: ${e.bedtime}`}
                      {e.bedtime && e.wakeTime && ' → '}
                      {e.wakeTime && `Wake: ${e.wakeTime}`}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(e.id)}
                  className="text-slate-500 hover:text-red-400 transition-colors ml-2"
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
