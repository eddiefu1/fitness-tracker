'use client'
import { useState, useEffect } from 'react'
import { storage } from '@/lib/storage'

export default function SummaryPage() {
  const [reflection, setReflection] = useState('')
  const [analysis, setAnalysis] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [weekStats, setWeekStats] = useState({ workouts: 0, avgSleep: 0, totalCalories: 0 })

  useEffect(() => {
    const wa = new Date()
    wa.setDate(wa.getDate() - 7)
    const w = storage.getWorkouts().filter(x => new Date(x.date) >= wa)
    const s = storage.getSleepEntries().filter(x => new Date(x.date) >= wa)
    const f = storage.getFoodEntries().filter(x => new Date(x.date) >= wa)
    setWeekStats({
      workouts: w.length,
      avgSleep: s.length > 0 ? s.reduce((a, e) => a + e.quality, 0) / s.length : 0,
      totalCalories: f.reduce((a, e) => a + e.calories, 0),
    })
  }, [])

  const generateSummary = async () => {
    setLoading(true)
    setError('')
    setAnalysis('')

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const weekData = {
      workouts: storage.getWorkouts().filter(w => new Date(w.date) >= weekAgo),
      food: storage.getFoodEntries().filter(f => new Date(f.date) >= weekAgo),
      sleep: storage.getSleepEntries().filter(s => new Date(s.date) >= weekAgo),
      weight: storage.getWeightEntries().filter(w => new Date(w.date) >= weekAgo),
    }

    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reflection, weekData }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate summary')
      setAnalysis(data.analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Weekly Summary 📝</h1>
        <p className="text-slate-400 mt-1">AI-powered analysis of your week</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 text-center">
          <p className="text-2xl font-bold text-blue-400">{weekStats.workouts}</p>
          <p className="text-slate-400 text-xs mt-1">Workouts</p>
        </div>
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 text-center">
          <p className="text-2xl font-bold text-purple-400">{weekStats.avgSleep.toFixed(1)}</p>
          <p className="text-slate-400 text-xs mt-1">Avg Sleep Quality</p>
        </div>
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 text-center">
          <p className="text-2xl font-bold text-green-400">{Math.round(weekStats.totalCalories)}</p>
          <p className="text-slate-400 text-xs mt-1">Total Calories</p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6">
        <h2 className="text-lg font-semibold text-slate-300 mb-3">Your Reflection</h2>
        <textarea
          value={reflection}
          onChange={e => setReflection(e.target.value)}
          placeholder="How did this week go? What went well? What challenges did you face?"
          rows={4}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 resize-none"
        />
        <button
          onClick={generateSummary}
          disabled={loading}
          className="mt-3 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-all"
        >
          {loading ? '✨ Analyzing your week...' : '✨ Generate AI Analysis'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-2xl p-4 mb-6 text-red-300">
          {error}
        </div>
      )}

      {analysis && (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <span>🤖</span> AI Coach Analysis
          </h2>
          <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">{analysis}</div>
        </div>
      )}
    </div>
  )
}
