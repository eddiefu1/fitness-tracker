'use client'

import Link from 'next/link'
import {
  computeWeightGoalDashboard,
  GOAL_WEIGHT_MID_LB,
} from '@/lib/weightGoalProgress'
import {
  GOAL_WEIGHT_HIGH_LB,
  GOAL_WEIGHT_LOW_LB,
  START_WEIGHT_LB,
} from '@/lib/weightLossSummary'
import type { WeightEntry } from '@/lib/storage'

type Props = {
  weights: WeightEntry[]
}

export default function TargetWeightCard({ weights }: Props) {
  const s = computeWeightGoalDashboard(weights)

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-200">Weight goal</h2>
          <p className="text-slate-400 text-sm mt-1">
            Plan start: <span className="text-slate-300">{START_WEIGHT_LB} lb</span>
            {' · '}
            Target band:{' '}
            <span className="text-emerald-300 font-medium">
              {GOAL_WEIGHT_LOW_LB}–{GOAL_WEIGHT_HIGH_LB} lb
            </span>
            {' '}
            (mid ~{GOAL_WEIGHT_MID_LB.toFixed(1)} lb)
          </p>
        </div>
        {s.percentFromStartToMid != null && (
          <div className="text-right">
            <p className="text-slate-400 text-xs uppercase tracking-wide">
              Toward mid (~{GOAL_WEIGHT_MID_LB.toFixed(1)} lb)
            </p>
            <p className="text-2xl font-bold text-emerald-400">
              {s.percentFromStartToMid.toFixed(0)}%
            </p>
          </div>
        )}
      </div>

      {s.latestLb == null ? (
        <p className="text-slate-400">
          Log your weight on the{' '}
          <Link href="/weight" className="text-indigo-400 hover:underline">
            Weight
          </Link>{' '}
          page to see progress and pace.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl bg-slate-900/60 border border-slate-600/50 p-4">
            <p className="text-slate-400 text-sm">Latest weight</p>
            <p className="text-3xl font-bold text-white mt-1">
              {s.latestLb} lb
            </p>
            <p className="text-slate-500 text-xs mt-1">{s.latestDateLabel}</p>
            {s.inGoalBand ? (
              <p className="text-emerald-400 text-sm mt-2">
                You are in your goal band — maintain habits and strength.
              </p>
            ) : s.latestLb > GOAL_WEIGHT_HIGH_LB ? (
              <p className="text-slate-400 text-sm mt-2">
                About{' '}
                <span className="text-amber-300 font-medium">
                  {(s.latestLb - GOAL_WEIGHT_MID_LB).toFixed(1)} lb
                </span>{' '}
                above the band midpoint (estimate to midpoint).
              </p>
            ) : (
              <p className="text-slate-400 text-sm mt-2">
                Below the goal band — prioritize health and performance; adjust
                with a clinician if needed.
              </p>
            )}
          </div>

          <div className="rounded-xl bg-slate-900/60 border border-slate-600/50 p-4">
            <p className="text-slate-400 text-sm">From start</p>
            <p className="text-2xl font-bold text-cyan-300 mt-1">
              {s.lbLostFromStart != null && s.lbLostFromStart > 0
                ? `−${s.lbLostFromStart.toFixed(1)} lb`
                : s.lbLostFromStart != null && s.lbLostFromStart < 0
                  ? `+${Math.abs(s.lbLostFromStart).toFixed(1)} lb vs start`
                  : '—'}
            </p>
            <p className="text-slate-500 text-xs mt-2">
              Weekly review in{' '}
              <span className="text-slate-300 font-semibold">
                {s.daysUntilNextSunday === 0
                  ? 'today (Sunday)'
                  : `${s.daysUntilNextSunday} day${s.daysUntilNextSunday === 1 ? '' : 's'}`}{' '}
              </span>
              — numbers refresh as you log weight.
            </p>
          </div>
        </div>
      )}

      {s.latestLb != null && s.ratePerWeek != null && (
        <div className="mt-4 rounded-xl border border-indigo-500/30 bg-indigo-950/40 p-4">
          <p className="text-indigo-200 text-sm font-medium">Pace (from your logs)</p>
          <p className="text-slate-300 text-sm mt-1">
            Recent trend:{' '}
            <span className="text-white font-semibold">
              {s.ratePerWeek >= 0 ? '−' : '+'}
              {Math.abs(s.ratePerWeek).toFixed(2)} lb/week
            </span>{' '}
            (first → latest weigh-in).
            {s.onTrackPace ? (
              <span className="text-emerald-400">
                {' '}
                · Near your ~1.5 lb/week plan (~1–2 lb/week band).
              </span>
            ) : (
              <span className="text-amber-300">
                {' '}
                · Outside the ~1–2 lb/week band around your plan — adjust if needed.
              </span>
            )}
          </p>
          {s.onTrackPace &&
            s.estimatedDaysToGoalMid != null &&
            s.latestLb > GOAL_WEIGHT_HIGH_LB && (
              <p className="text-slate-200 text-sm mt-2">
                <span className="text-emerald-400 font-semibold">On track:</span>{' '}
                roughly{' '}
                <span className="text-white font-bold">
                  {s.estimatedDaysToGoalMid} days
                </span>{' '}
                to the goal midpoint at this pace (estimate; updates weekly as you
                log).
              </p>
            )}
          {!s.onTrackPace &&
            s.latestLb > GOAL_WEIGHT_HIGH_LB &&
            s.ratePerWeek > 0 &&
            s.ratePerWeek < 1 && (
              <p className="text-slate-400 text-sm mt-2">
                Log weight regularly — when pace is ~1–2 lb/week, a day countdown to
                goal will show here.
              </p>
            )}
        </div>
      )}
    </div>
  )
}
