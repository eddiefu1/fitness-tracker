'use client'
import Link from 'next/link'
import type { LatestWhoopMetrics } from '@/lib/whoopMetrics'
import { scoreColor, scoreLabel, strainColor, strainLabel } from '@/lib/whoopMetrics'

type Props = {
  metrics: LatestWhoopMetrics
}

function Tile({
  label,
  value,
  sub,
  valueClass = 'text-slate-200',
}: {
  label: string
  value: string
  sub?: string
  valueClass?: string
}) {
  return (
    <div className="rounded-xl bg-slate-900/60 border border-slate-700/50 px-3 py-3 text-center">
      <p className={`text-xl font-bold tabular-nums leading-none ${valueClass}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
      <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">{label}</p>
    </div>
  )
}

function recoveryGradient(score: number | null): string {
  if (score == null) return 'from-slate-700 to-slate-600'
  if (score >= 67) return 'from-emerald-600 to-teal-500'
  if (score >= 34) return 'from-amber-600 to-yellow-500'
  return 'from-rose-700 to-rose-500'
}

export default function WhoopMetricsPanel({ metrics }: Props) {
  if (!metrics.hasData) {
    return (
      <div className="rounded-2xl border border-slate-700/60 bg-slate-800/80 p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">⌚</span>
          <h2 className="text-lg font-semibold text-slate-200">WHOOP</h2>
        </div>
        <p className="text-slate-500 text-sm mb-4">
          Connect and sync WHOOP to see recovery, HRV, sleep, and strain on your dashboard.
        </p>
        <Link
          href="/whoop"
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Set up WHOOP →
        </Link>
      </div>
    )
  }

  const rec = metrics.recoveryScore
  const recPct = rec != null ? Math.min(rec / 100, 1) : 0

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-6 shadow-xl shadow-black/20">
      <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/8 blur-3xl" />

      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <span className="text-xl">⌚</span>
          <h2 className="text-lg font-semibold text-slate-100">WHOOP</h2>
        </div>
        {metrics.syncedAt && (
          <p className="text-[11px] text-slate-600 mt-1 shrink-0">
            Synced {new Date(metrics.syncedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </p>
        )}
      </div>

      {rec != null && (
        <div className="mb-5">
          <div className="flex items-end justify-between mb-1.5">
            <p className="text-sm text-slate-400">Recovery</p>
            <span className={`text-sm font-semibold ${scoreColor(rec)}`}>{scoreLabel(rec)}</span>
          </div>
          <div className="h-5 rounded-full bg-slate-700/80 overflow-hidden ring-1 ring-slate-600/40">
            <div
              className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${recoveryGradient(rec)}`}
              style={{ width: `${recPct * 100}%` }}
            />
          </div>
          <p className={`text-3xl font-extrabold tabular-nums mt-2 ${scoreColor(rec)}`}>
            {Math.round(rec)}
            <span className="text-slate-600 font-normal text-lg">/100</span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Tile
          label="HRV"
          value={metrics.hrv != null ? `${Math.round(metrics.hrv)} ms` : '—'}
          sub="rMSSD"
          valueClass="text-violet-300"
        />
        <Tile
          label="RHR"
          value={metrics.rhr != null ? `${Math.round(metrics.rhr)} bpm` : '—'}
          sub="resting"
          valueClass="text-sky-300"
        />
        <Tile
          label="Sleep"
          value={
            metrics.sleepPerformancePct != null
              ? `${Math.round(metrics.sleepPerformancePct)}%`
              : '—'
          }
          sub={
            metrics.sleepDurationHours != null
              ? `${metrics.sleepDurationHours}h`
              : 'no data'
          }
          valueClass={scoreColor(metrics.sleepPerformancePct)}
        />
        <Tile
          label="Strain"
          value={metrics.cycleStrain != null ? metrics.cycleStrain.toFixed(1) : '—'}
          sub={strainLabel(metrics.cycleStrain)}
          valueClass={strainColor(metrics.cycleStrain)}
        />
      </div>

      {metrics.avgRecovery7d != null && (
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
          <span>
            7-day avg recovery:{' '}
            <span className={`font-semibold ${scoreColor(metrics.avgRecovery7d)}`}>
              {metrics.avgRecovery7d}
            </span>
          </span>
          <span>
            WHOOP workouts this week:{' '}
            <span className="text-slate-300 font-semibold">{metrics.whoopWorkouts7d}</span>
          </span>
        </div>
      )}

      <Link
        href="/whoop"
        className="inline-block mt-4 text-xs text-indigo-400 hover:text-indigo-300"
      >
        View all WHOOP data →
      </Link>
    </div>
  )
}
