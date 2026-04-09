'use client'
import { useState, useEffect, useCallback } from 'react'
import { storage, WeightEntry } from '@/lib/storage'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function WeightPage() {
  const [entries, setEntries] = useState<WeightEntry[]>([])
  const [weight, setWeight] = useState('')
  const [withingsConnected, setWithingsConnected] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [origin, setOrigin] = useState('')

  const refresh = useCallback(() => {
    setEntries(storage.getWeightEntries())
  }, [])

  useEffect(() => {
    refresh()
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [refresh])

  useEffect(() => {
    fetch('/api/withings/status', { credentials: 'include' })
      .then((r) => r.json())
      .then((d: { connected?: boolean }) =>
        setWithingsConnected(Boolean(d.connected))
      )
      .catch(() => setWithingsConnected(false))
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const q = new URLSearchParams(window.location.search)
    const w = q.get('withings')
    const msg = q.get('message')
    if (w === 'connected') {
      setSyncMsg('Withings connected — tap “Sync from Withings” to import history.')
      setWithingsConnected(true)
    } else if (w === 'disconnected') setSyncMsg('Withings disconnected.')
    else if (w === 'error' && msg) setSyncMsg(`Withings: ${decodeURIComponent(msg)}`)
  }, [])

  const handleSyncWithings = async () => {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const r = await fetch('/api/withings/sync', {
        method: 'POST',
        credentials: 'include',
      })
      const data = await r.json()
      if (!r.ok || !data.ok) {
        setSyncMsg(data.error || 'Sync failed')
        return
      }
      const rows = data.measurements as Array<{
        id: string
        date: string
        weight: number
      }>
      storage.mergeWeightEntriesFromWithings(
        rows.map((m) => ({ id: m.id, date: m.date, weight: m.weight }))
      )
      refresh()
      setSyncMsg(`Imported ${data.imported} weight readings from Withings.`)
    } catch {
      setSyncMsg('Network error during sync.')
    } finally {
      setSyncing(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const entry: WeightEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      weight: Number(weight),
    }
    storage.saveWeightEntry(entry)
    setEntries(storage.getWeightEntries())
    setWeight('')
  }

  const handleDelete = (id: string) => {
    storage.deleteWeightEntry(id)
    setEntries(storage.getWeightEntries())
  }

  const chartData = [...entries]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((e) => ({
      date: new Date(e.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      weight: e.weight,
    }))

  const latest = entries[0]?.weight
  const earliest = entries.length > 1 ? entries[entries.length - 1]?.weight : null
  const change = latest && earliest ? (latest - earliest).toFixed(1) : null

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Weight Tracker ⚖️</h1>
        <p className="text-slate-400 mt-1">Manual logs + optional Withings sync</p>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6">
        <h2 className="text-lg font-semibold text-slate-300 mb-2">Withings</h2>
        <p className="text-slate-400 text-sm mb-4">
          Connect your Withings account to pull historical body weight (stored in this browser
          alongside manual entries). Add the callback URL in the Withings developer portal:
          <code className="block mt-2 text-xs text-indigo-300 break-all bg-slate-900/80 p-2 rounded">
            {origin || '(open this page in the browser)'}/api/withings/callback
          </code>
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/api/withings/login"
            className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Connect Withings
          </a>
          <button
            type="button"
            disabled={!withingsConnected || syncing}
            onClick={handleSyncWithings}
            className="inline-flex items-center justify-center bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {syncing ? 'Syncing…' : 'Sync from Withings'}
          </button>
          <a
            href="/api/withings/disconnect"
            className="text-sm text-slate-500 hover:text-red-400"
          >
            Disconnect
          </a>
          <span className="text-sm text-slate-500">
            {withingsConnected ? '● Connected' : '○ Not connected'}
          </span>
        </div>
        {syncMsg && (
          <p className="text-slate-300 text-sm mt-3 whitespace-pre-wrap">{syncMsg}</p>
        )}
      </div>

      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 text-center">
            <p className="text-4xl font-bold text-orange-400">{latest}</p>
            <p className="text-slate-400 text-sm mt-1">Current (lbs)</p>
          </div>
          {change && (
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 text-center">
              <p
                className={`text-4xl font-bold ${Number(change) < 0 ? 'text-green-400' : 'text-red-400'}`}
              >
                {Number(change) > 0 ? '+' : ''}
                {change}
              </p>
              <p className="text-slate-400 text-sm mt-1">Total Change (lbs)</p>
            </div>
          )}
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 text-center">
            <p className="text-4xl font-bold text-blue-400">{entries.length}</p>
            <p className="text-slate-400 text-sm mt-1">Entries Logged</p>
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6">
        <h2 className="text-lg font-semibold text-slate-300 mb-4">Log Weight</h2>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="number"
            min="50"
            max="600"
            step="0.1"
            required
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Enter weight in lbs"
            className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
          />
          <button
            type="submit"
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
          >
            Log
          </button>
        </form>
      </div>

      {chartData.length >= 2 && (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6">
          <h2 className="text-lg font-semibold text-slate-300 mb-4">Weight Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#fb923c' }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#fb923c"
                strokeWidth={2}
                dot={{ fill: '#fb923c', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-slate-300 mb-4">
          Weight History ({entries.length})
        </h2>
        {entries.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No weight logged yet.</p>
        ) : (
          <div className="space-y-2">
            {entries.map((e) => (
              <div
                key={e.id}
                className="bg-slate-700 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <span className="text-white font-semibold">{e.weight} lbs</span>
                  <span className="text-slate-400 text-sm ml-3">
                    {new Date(e.date).toLocaleString()}
                  </span>
                  {e.id.startsWith('withings-') && (
                    <span className="ml-2 text-xs text-indigo-400">Withings</span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(e.id)}
                  className="text-slate-500 hover:text-red-400"
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
