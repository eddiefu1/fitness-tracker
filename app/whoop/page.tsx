'use client'

import { useCallback, useEffect, useState } from 'react'
import { storage } from '@/lib/storage'
import type { WhoopStoredData } from '@/lib/whoop/types'

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

export default function WhoopPage() {
  const [connected, setConnected] = useState(false)
  const [data, setData] = useState<WhoopStoredData | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  const loadLocal = useCallback(() => {
    setData(storage.getWhoopData())
  }, [])

  useEffect(() => {
    loadLocal()
    fetch('/api/whoop/status', { credentials: 'include' })
      .then((r) => r.json())
      .then((d: { connected?: boolean }) => setConnected(Boolean(d.connected)))
      .catch(() => setConnected(false))
  }, [loadLocal])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const q = new URLSearchParams(window.location.search)
    const w = q.get('whoop')
    const m = q.get('message')
    if (w === 'connected') {
      setMsg('WHOOP connected — run a sync to download history.')
      setConnected(true)
    } else if (w === 'disconnected') setMsg('WHOOP disconnected (browser cache kept until cleared).')
    else if (w === 'error' && m) setMsg(decodeURIComponent(m))
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    setMsg(null)
    try {
      const r = await fetch('/api/whoop/sync', {
        method: 'POST',
        credentials: 'include',
      })
      const j = await r.json()
      if (!r.ok || !j.ok) {
        setMsg(j.error || 'Sync failed')
        return
      }
      storage.setWhoopData(j.data as WhoopStoredData)
      loadLocal()
      const w = (j.warnings as string[] | undefined)?.join(' · ')
      setMsg(
        w
          ? `Synced. Some sections had issues: ${w}`
          : 'Synced WHOOP data into this browser.'
      )
    } catch {
      setMsg('Network error during sync.')
    } finally {
      setSyncing(false)
    }
  }

  const workouts = data?.workouts ?? []
  const recoveries = data?.recoveries ?? []
  const sleeps = data?.sleeps ?? []
  const cycles = data?.cycles ?? []

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">WHOOP</h1>
        <p className="text-slate-400 mt-1">
          Connect and sync recovery, strain cycles, sleep, and workouts (stored locally in this
          browser).
        </p>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6">
        <p className="text-slate-400 text-sm mb-4">
          Register this redirect URL in the{' '}
          <a
            href="https://developer-dashboard.whoop.com"
            className="text-indigo-400 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            WHOOP Developer Dashboard
          </a>
          :
        </p>
        <code className="block text-xs text-indigo-300 break-all bg-slate-900/80 p-2 rounded mb-4">
          {typeof window !== 'undefined' ? window.location.origin : ''}/api/whoop/callback
        </code>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/api/whoop/login"
            className="inline-flex bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg"
          >
            Connect WHOOP
          </a>
          <button
            type="button"
            disabled={!connected || syncing}
            onClick={handleSync}
            className="inline-flex bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg"
          >
            {syncing ? 'Syncing…' : 'Sync now'}
          </button>
          <a href="/api/whoop/disconnect" className="text-sm text-slate-500 hover:text-red-400">
            Disconnect account
          </a>
          <button
            type="button"
            onClick={() => {
              storage.clearWhoopData()
              loadLocal()
              setMsg('Cleared local WHOOP cache.')
            }}
            className="text-sm text-slate-500 hover:text-amber-400"
          >
            Clear local cache
          </button>
          <span className="text-sm text-slate-500">
            {connected ? '● API connected' : '○ Not connected'}
          </span>
        </div>
        {msg && <p className="text-slate-300 text-sm mt-3 whitespace-pre-wrap">{msg}</p>}
      </div>

      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Recoveries" value={recoveries.length} />
            <Stat label="Sleeps" value={sleeps.length} />
            <Stat label="Workouts" value={workouts.length} />
            <Stat label="Cycles" value={cycles.length} />
          </div>

          {data.profile && (
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
              <h2 className="text-slate-200 font-semibold mb-2">Profile</h2>
              <p className="text-slate-400 text-sm">
                {[data.profile.first_name, data.profile.last_name].filter(Boolean).join(' ') ||
                  '—'}
              </p>
              <p className="text-slate-500 text-sm">{data.profile.email || ''}</p>
            </div>
          )}

          {data.bodyMeasurement && (
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
              <h2 className="text-slate-200 font-semibold mb-2">Body (WHOOP)</h2>
              <ul className="text-slate-400 text-sm space-y-1">
                {data.bodyMeasurement.weight_kilogram != null && (
                  <li>
                    Weight:{' '}
                    {(data.bodyMeasurement.weight_kilogram * 2.20462).toFixed(1)} lb (
                    {data.bodyMeasurement.weight_kilogram.toFixed(1)} kg)
                  </li>
                )}
                {data.bodyMeasurement.height_meter != null && (
                  <li>Height: {(data.bodyMeasurement.height_meter * 39.3701).toFixed(1)} in</li>
                )}
                {data.bodyMeasurement.max_heart_rate != null && (
                  <li>Max HR: {data.bodyMeasurement.max_heart_rate} bpm</li>
                )}
              </ul>
            </div>
          )}

          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
            <h2 className="text-slate-200 font-semibold mb-3">Recent recovery (latest 15)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-600">
                    <th className="py-2 pr-3">Cycle</th>
                    <th className="py-2 pr-3">Score</th>
                    <th className="py-2 pr-3">RHR</th>
                    <th className="py-2">HRV (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {recoveries.slice(0, 15).map((r, i) => {
                    const rec = r as Record<string, unknown>
                    const score = rec.score as Record<string, unknown> | undefined
                    return (
                      <tr key={i} className="border-b border-slate-700/80 text-slate-300">
                        <td className="py-2 pr-3">{String(rec.cycle_id ?? '—')}</td>
                        <td className="py-2 pr-3">{num(score?.recovery_score) ?? '—'}</td>
                        <td className="py-2 pr-3">{num(score?.resting_heart_rate) ?? '—'}</td>
                        <td className="py-2">
                          {score?.hrv_rmssd_milli != null
                            ? (Number(score.hrv_rmssd_milli) / 1000).toFixed(2)
                            : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
            <h2 className="text-slate-200 font-semibold mb-3">Recent workouts (latest 20)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-600">
                    <th className="py-2 pr-3">Start</th>
                    <th className="py-2 pr-3">Sport</th>
                    <th className="py-2 pr-3">Strain</th>
                    <th className="py-2">Avg HR</th>
                  </tr>
                </thead>
                <tbody>
                  {workouts.slice(0, 20).map((w, i) => {
                    const row = w as Record<string, unknown>
                    const sc = row.score as Record<string, unknown> | undefined
                    const start = row.start ? new Date(String(row.start)).toLocaleString() : '—'
                    return (
                      <tr key={i} className="border-b border-slate-700/80 text-slate-300">
                        <td className="py-2 pr-3 whitespace-nowrap">{start}</td>
                        <td className="py-2 pr-3">{String(row.sport_name ?? '—')}</td>
                        <td className="py-2 pr-3">
                          {sc?.strain != null ? Number(sc.strain).toFixed(2) : '—'}
                        </td>
                        <td className="py-2">{num(sc?.average_heart_rate) ?? '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-slate-500 text-xs">
            Last synced: {data.syncedAt ? new Date(data.syncedAt).toLocaleString() : '—'} · Pagination
            pulls up to ~100 pages per category (25 rows each). Not medical advice.
          </p>
        </div>
      )}

      {!data && (
        <p className="text-slate-500 text-sm">
          No WHOOP data in this browser yet. Connect, then sync to import your history.
        </p>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-center">
      <p className="text-2xl font-bold text-cyan-400">{value}</p>
      <p className="text-slate-500 text-xs mt-1">{label}</p>
    </div>
  )
}
