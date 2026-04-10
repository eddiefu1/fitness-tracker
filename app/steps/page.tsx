'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { storage, StepEntry } from '@/lib/storage'
import { buildStepsSeries } from '@/lib/stepsSeries'
import { localDateKey, parseEntryDateMs } from '@/lib/dateHelpers'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

const CHART_DAYS = 21

function todayDateInputValue(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function StepsPage() {
  const [entries, setEntries] = useState<StepEntry[]>([])
  const [steps, setSteps] = useState('')
  const [day, setDay] = useState(todayDateInputValue)
  const [mounted, setMounted] = useState(false)

  const refresh = useCallback(() => {
    setEntries(storage.getStepEntries())
  }, [])

  useEffect(() => {
    refresh()
    setMounted(true)
  }, [refresh])

  const series = useMemo(
    () => buildStepsSeries(entries, CHART_DAYS),
    [entries]
  )

  const deltaSeries = useMemo(
    () =>
      series.slice(1).map((d) => ({
        label: d.label,
        dateKey: d.dateKey,
        delta: d.delta ?? 0,
      })),
    [series]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const n = Number(steps)
    if (!Number.isFinite(n) || n < 0 || n > 200000) return
    const [yy, mm, dd] = day.split('-').map(Number)
    const d = new Date(yy, mm - 1, dd, 12, 0, 0, 0)
    const entry: StepEntry = {
      id: crypto.randomUUID(),
      date: d.toISOString(),
      steps: Math.round(n),
    }
    storage.saveStepEntry(entry)
    refresh()
    setSteps('')
  }

  const handleDelete = (id: string) => {
    storage.deleteStepEntry(id)
    refresh()
  }

  const axis = { fill: '#94a3b8', fontSize: 11 }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Steps</h1>
        <p className="text-slate-400 mt-1">Daily step count — stored in this browser</p>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6">
        <h2 className="text-lg font-semibold text-slate-300 mb-4">Log steps</h2>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
          <div>
            <label htmlFor="step-day" className="block text-xs text-slate-500 mb-1">
              Day
            </label>
            <input
              id="step-day"
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-sky-500"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label htmlFor="step-count" className="block text-xs text-slate-500 mb-1">
              Steps
            </label>
            <input
              id="step-count"
              type="number"
              min="0"
              max="200000"
              step="1"
              required
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder="e.g. 8420"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-sky-500"
            />
          </div>
          <button
            type="submit"
            className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
          >
            Save
          </button>
        </form>
        <p className="text-slate-500 text-xs mt-3">
          Multiple entries on the same calendar day add together in totals and charts.
        </p>
      </div>

      {series.some((p) => p.steps > 0) && (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6">
          <h2 className="text-lg font-semibold text-slate-300 mb-1">
            Last {CHART_DAYS} days — steps
          </h2>
          <p className="text-slate-500 text-sm mb-4">Day-to-day total; missing days show 0.</p>
          <div className="h-[260px] w-full min-w-0">
            {!mounted ? (
              <div className="h-full rounded-xl bg-slate-900/50 animate-pulse ring-1 ring-slate-700/50" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={axis}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-40}
                    textAnchor="end"
                    height={64}
                  />
                  <YAxis
                    tick={axis}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    label={{
                      value: 'Steps',
                      angle: -90,
                      position: 'insideLeft',
                      fill: '#64748b',
                      fontSize: 11,
                    }}
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
                      typeof value === 'number'
                        ? `${Math.round(value).toLocaleString()} steps`
                        : String(value ?? '')
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey="steps"
                    name="Steps"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#38bdf8' }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {deltaSeries.length > 0 && series.some((p) => p.steps > 0) && (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6">
          <h2 className="text-lg font-semibold text-slate-300 mb-1">Day-to-day change</h2>
          <p className="text-slate-500 text-sm mb-4">
            Difference vs the previous day (first day in the window has no prior day).
          </p>
          <div className="h-[220px] w-full min-w-0">
            {!mounted ? (
              <div className="h-full rounded-xl bg-slate-900/50 animate-pulse ring-1 ring-slate-700/50" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={deltaSeries} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={axis}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-40}
                    textAnchor="end"
                    height={64}
                  />
                  <YAxis
                    tick={axis}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                    label={{
                      value: 'Δ steps',
                      angle: -90,
                      position: 'insideLeft',
                      fill: '#64748b',
                      fontSize: 11,
                    }}
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
                      typeof value === 'number'
                        ? `${value >= 0 ? '+' : ''}${Math.round(value).toLocaleString()} vs prior day`
                        : String(value ?? '')
                    }
                  />
                  <Bar dataKey="delta" name="Change" radius={[4, 4, 0, 0]} maxBarSize={36}>
                    {deltaSeries.map((d) => (
                      <Cell
                        key={d.dateKey}
                        fill={d.delta >= 0 ? '#34d399' : '#f87171'}
                      />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-slate-300 mb-4">
          History ({entries.length})
        </h2>
        {entries.length === 0 ? (
          <p className="text-slate-400">No step logs yet.</p>
        ) : (
          <ul className="space-y-2">
            {entries.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-3 py-2 border-b border-slate-700 last:border-0"
              >
                <div>
                  <p className="text-white font-medium tabular-nums">
                    {e.steps.toLocaleString()} steps
                  </p>
                  <p className="text-slate-500 text-sm">
                    {localDateKey(parseEntryDateMs(e.date))} ·{' '}
                    {new Date(e.date).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(e.id)}
                  className="text-sm text-slate-500 hover:text-red-400 shrink-0"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
