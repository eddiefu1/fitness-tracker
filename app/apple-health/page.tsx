'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { mergeAppleHealthIntoStorage } from '@/lib/appleHealth/merge'
import type { AppleHealthIngestPayload } from '@/lib/appleHealth/types'

const LS_BEARER = 'fitness_apple_health_bearer'
const LS_AUTO_PULL = 'fitness_apple_health_auto_pull'

function parsePayload(raw: string): AppleHealthIngestPayload | null {
  let j: unknown
  try {
    j = JSON.parse(raw)
  } catch {
    return null
  }
  if (!j || typeof j !== 'object') return null
  const o = j as Record<string, unknown>
  if (o.normalized && typeof o.normalized === 'object') {
    const n = o.normalized as Record<string, unknown>
    return {
      exportedAt: typeof o.exportedAt === 'string' ? o.exportedAt : undefined,
      steps: Array.isArray(n.steps) ? (n.steps as AppleHealthIngestPayload['steps']) : undefined,
      weight: Array.isArray(n.weight) ? (n.weight as AppleHealthIngestPayload['weight']) : undefined,
      workouts: Array.isArray(n.workouts)
        ? (n.workouts as AppleHealthIngestPayload['workouts'])
        : undefined,
    }
  }
  return j as AppleHealthIngestPayload
}

export default function AppleHealthPage() {
  const [text, setText] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [syncKey, setSyncKey] = useState('')
  const [rememberKey, setRememberKey] = useState(false)
  const [autoPullOnOpen, setAutoPullOnOpen] = useState(false)
  const [pulling, setPulling] = useState(false)
  const autoPullDone = useRef(false)
  const skipNextPersist = useRef(true)

  const origin = useMemo(
    () => (typeof window !== 'undefined' ? window.location.origin : ''),
    []
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const k = localStorage.getItem(LS_BEARER)
    if (k) setSyncKey(k)
    setRememberKey(Boolean(k))
    setAutoPullOnOpen(localStorage.getItem(LS_AUTO_PULL) === '1')
  }, [])

  const persistKeyPrefs = useCallback((key: string, remember: boolean, auto: boolean) => {
    if (typeof window === 'undefined') return
    if (remember && key.trim()) localStorage.setItem(LS_BEARER, key.trim())
    else localStorage.removeItem(LS_BEARER)
    localStorage.setItem(LS_AUTO_PULL, auto ? '1' : '0')
  }, [])

  useEffect(() => {
    if (skipNextPersist.current) {
      skipNextPersist.current = false
      return
    }
    persistKeyPrefs(syncKey, rememberKey, autoPullOnOpen)
  }, [syncKey, rememberKey, autoPullOnOpen, persistKeyPrefs])

  const example = useMemo(
    () =>
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          steps: [
            { id: 'sample-step-uuid', date: new Date().toISOString(), steps: 8420 },
          ],
          weight: [{ id: 'sample-weight-uuid', date: new Date().toISOString(), weightLb: 185.2 }],
          workouts: [
            {
              id: 'sample-workout-uuid',
              date: new Date().toISOString(),
              type: 'Running',
              duration: 35,
              caloriesBurned: 320,
              notes: 'From Apple Health',
              category: 'cardio' as const,
            },
          ],
        },
        null,
        2
      ),
    []
  )

  const runPullFromCloud = useCallback(
    async (opts?: { silent?: boolean; keyOverride?: string }) => {
      const key = (opts?.keyOverride ?? syncKey).trim()
      if (!key) {
        if (!opts?.silent) setMsg('Enter your sync key (same value as APPLE_HEALTH_SYNC_SECRET).')
        return
      }
      if (!opts?.silent) setMsg(null)
      setPulling(true)
      try {
        const r = await fetch(`${origin}/api/apple-health/pull`, {
          headers: { Authorization: `Bearer ${key}` },
        })
        const j = (await r.json()) as {
          ok?: boolean
          error?: string
          normalized?: { steps?: unknown; weight?: unknown; workouts?: unknown }
          serverSyncedAt?: string | null
          empty?: boolean
        }
        if (!r.ok || !j.ok) {
          setMsg(j.error || 'Pull failed.')
          return
        }
        const n = j.normalized
        const payload: AppleHealthIngestPayload = {
          steps: Array.isArray(n?.steps) ? (n.steps as AppleHealthIngestPayload['steps']) : undefined,
          weight: Array.isArray(n?.weight) ? (n.weight as AppleHealthIngestPayload['weight']) : undefined,
          workouts: Array.isArray(n?.workouts)
            ? (n.workouts as AppleHealthIngestPayload['workouts'])
            : undefined,
        }
        const totalRows =
          (payload.steps?.length ?? 0) +
          (payload.weight?.length ?? 0) +
          (payload.workouts?.length ?? 0)
        if (totalRows === 0 && j.empty) {
          setMsg(
            'Cloud snapshot is empty. POST from Shortcuts to /api/apple-health/ingest first (with Redis configured).'
          )
          return
        }
        const result = mergeAppleHealthIntoStorage(payload)
        const parts = [
          `steps +${result.stepsAdded} (skipped ${result.stepsSkipped})`,
          `weight +${result.weightAdded} (skipped ${result.weightSkipped})`,
          `workouts +${result.workoutsAdded} (skipped ${result.workoutsSkipped})`,
        ]
        const when = j.serverSyncedAt
          ? `Server snapshot: ${new Date(j.serverSyncedAt).toLocaleString()}`
          : 'Server snapshot time unknown'
        setMsg(
          `${opts?.silent ? 'Auto-sync: ' : ''}Merged into this browser — ${parts.join(' · ')}. ${when}.`
        )
        if (result.errors.length) {
          setMsg(
            (m) => `${m}\nWarnings: ${result.errors.slice(0, 5).join(' · ')}`
          )
        }
      } catch {
        setMsg('Network error during pull.')
      } finally {
        setPulling(false)
      }
    },
    [origin, syncKey]
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (autoPullDone.current) return
    if (localStorage.getItem(LS_AUTO_PULL) !== '1') return
    const k = localStorage.getItem(LS_BEARER)
    if (!k?.trim()) return
    autoPullDone.current = true
    void runPullFromCloud({ silent: true, keyOverride: k })
  }, [runPullFromCloud])

  const handleMerge = useCallback(() => {
    setMsg(null)
    const payload = parsePayload(text.trim())
    if (!payload) {
      setMsg('Could not parse JSON. Paste an ingest payload or the `normalized` object from the API.')
      return
    }
    const totalRows =
      (payload.steps?.length ?? 0) +
      (payload.weight?.length ?? 0) +
      (payload.workouts?.length ?? 0)
    const hasAny = totalRows > 0
    if (!hasAny) {
      setMsg('No steps, weight, or workouts in this JSON.')
      return
    }
    const r = mergeAppleHealthIntoStorage(payload)
    const parts = [
      `steps +${r.stepsAdded} (skipped ${r.stepsSkipped})`,
      `weight +${r.weightAdded} (skipped ${r.weightSkipped})`,
      `workouts +${r.workoutsAdded} (skipped ${r.workoutsSkipped})`,
    ]
    setMsg(`Merged into this browser: ${parts.join(' · ')}`)
    if (r.errors.length) setMsg((m) => `${m}\nWarnings: ${r.errors.slice(0, 5).join(' · ')}`)
  }, [text])

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Apple Health</h1>
        <p className="text-slate-400 mt-1">
          HealthKit data is read on Apple devices with{' '}
          <a
            href="https://developer.apple.com/documentation/healthkit/hkhealthstore"
            className="text-sky-400 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            HKHealthStore
          </a>{' '}
          (authorization and queries). With Upstash Redis on the server, Shortcuts can POST into a
          cloud snapshot; you pull it here into the same local data as Steps, Weight, and Workouts.
        </p>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-300">Why not a web “Connect” button?</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          Apple does not expose HealthKit to websites. A Shortcuts automation or a small Swift app
          requests read access via <code className="text-sky-300">requestAuthorization(toShare:read:)</code>, runs
          queries with <code className="text-sky-300">execute(_:)</code>, then POSTs JSON to this site.
        </p>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6">
        <h2 className="text-lg font-semibold text-slate-300 mb-2">Cloud sync (recommended)</h2>
        <p className="text-slate-400 text-sm mb-4">
          Add a free{' '}
          <a
            href="https://upstash.com/"
            className="text-sky-400 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Upstash Redis
          </a>{' '}
          database and set <code className="text-slate-400">UPSTASH_REDIS_REST_URL</code> and{' '}
          <code className="text-slate-400">UPSTASH_REDIS_REST_TOKEN</code> in Vercel (or{' '}
          <code className="text-slate-400">.env</code> locally). Use the same random string for{' '}
          <code className="text-slate-400">APPLE_HEALTH_SYNC_SECRET</code> below and in your Shortcut
          Authorization header.
        </p>
        <label className="block text-xs text-slate-500 mb-1" htmlFor="apple-sync-key">
          Sync key (matches <code className="text-slate-500">APPLE_HEALTH_SYNC_SECRET</code>)
        </label>
        <input
          id="apple-sync-key"
          type="password"
          autoComplete="off"
          value={syncKey}
          onChange={(e) => setSyncKey(e.target.value)}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500 mb-3"
          placeholder="Paste your server secret once"
        />
        <div className="flex flex-col gap-2 mb-4">
          <label className="flex items-center gap-2 text-slate-400 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={rememberKey}
              onChange={(e) => setRememberKey(e.target.checked)}
              className="rounded border-slate-600"
            />
            Remember key in this browser (stored in localStorage)
          </label>
          <label className="flex items-center gap-2 text-slate-400 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={autoPullOnOpen}
              onChange={(e) => setAutoPullOnOpen(e.target.checked)}
              className="rounded border-slate-600"
            />
            Pull from cloud automatically when I open this page (requires remembered key)
          </label>
        </div>
        <button
          type="button"
          disabled={pulling}
          onClick={() => void runPullFromCloud()}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
        >
          {pulling ? 'Pulling…' : 'Pull from cloud into FitTracker'}
        </button>
        <p className="text-slate-500 text-xs mt-3">
          GET <code className="text-slate-400">{origin}/api/apple-health/pull</code> with{' '}
          <code className="text-slate-400">Authorization: Bearer &lt;secret&gt;</code> — this button does
          that and merges into localStorage.
        </p>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6">
        <h2 className="text-lg font-semibold text-slate-300 mb-2">POST ingest (Shortcuts / app)</h2>
        <p className="text-slate-400 text-sm mb-3">
          POST JSON to{' '}
          <code className="text-indigo-300 break-all">{origin}/api/apple-health/ingest</code> with{' '}
          <code className="text-slate-400">Authorization: Bearer &lt;secret&gt;</code>. When Redis is
          set, the server merges each POST into your snapshot for pull.
        </p>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6">
        <h2 className="text-lg font-semibold text-slate-300 mb-2">Merge JSON manually (fallback)</h2>
        <p className="text-slate-400 text-sm mb-4">
          Paste a payload with <code className="text-slate-400">steps</code>,{' '}
          <code className="text-slate-400">weight</code>, and/or <code className="text-slate-400">workouts</code>.
          Weight can use <code className="text-slate-400">weightLb</code> or{' '}
          <code className="text-slate-400">weightKg</code>. Duplicate IDs are skipped.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 text-sm font-mono focus:outline-none focus:border-sky-500"
          placeholder='{ "steps": [...], "weight": [...], "workouts": [...] }'
        />
        <div className="flex flex-wrap gap-3 mt-4">
          <button
            type="button"
            onClick={handleMerge}
            className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
          >
            Merge into FitTracker
          </button>
          <button
            type="button"
            onClick={() => setText(example)}
            className="bg-slate-700 hover:bg-slate-600 text-white font-medium px-4 py-2.5 rounded-lg"
          >
            Load example JSON
          </button>
        </div>
        {msg && (
          <p className="text-slate-300 text-sm mt-4 whitespace-pre-wrap border-t border-slate-700 pt-4">
            {msg}
          </p>
        )}
      </div>
    </div>
  )
}
