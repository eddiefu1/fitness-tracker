'use client'
import Link from 'next/link'
import { WellnessScore as WellnessScoreType } from '@/lib/wellness'

interface Props {
  score: WellnessScoreType
}

type Pillar = {
  label: string
  icon: string
  value: number
  max: number
  hint?: string
  locked?: boolean
}

function barColor(pct: number): string {
  if (pct >= 0.8) return 'from-emerald-500 to-teal-400'
  if (pct >= 0.5) return 'from-amber-500 to-yellow-400'
  return 'from-rose-600 to-rose-400'
}

function ringColor(total: number): string {
  if (total >= 75) return '#10b981'
  if (total >= 50) return '#f59e0b'
  return '#f43f5e'
}

export default function WellnessScore({ score }: Props) {
  const C = 2 * Math.PI * 54
  const dashOffset = C - (score.total / 100) * C
  const rc = ringColor(score.total)

  const pillars: Pillar[] = [
    {
      label: 'Recovery',
      icon: '💚',
      value: score.recovery,
      max: 20,
      hint: score.hasWhoopData ? undefined : 'Connect WHOOP',
      locked: !score.hasWhoopData,
    },
    {
      label: 'Sleep',
      icon: '🌙',
      value: score.sleep,
      max: 20,
      hint: score.hasWhoopData ? undefined : 'Connect WHOOP',
      locked: !score.hasWhoopData,
    },
    { label: 'Activity', icon: '🏋️', value: score.activity, max: 20 },
    { label: 'Nutrition', icon: '🥗', value: score.nutrition, max: 20 },
    {
      label: 'Steps',
      icon: '👟',
      value: score.steps,
      max: 10,
      hint: score.hasStepData ? undefined : 'Log steps',
      locked: !score.hasStepData,
    },
    { label: 'Consistency', icon: '📅', value: score.consistency, max: 10 },
  ]

  const label =
    score.total >= 80
      ? 'Excellent'
      : score.total >= 65
        ? 'Good'
        : score.total >= 45
          ? 'Fair'
          : 'Needs work'

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-6 shadow-xl">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/8 blur-3xl" />

      <h2 className="text-lg font-semibold text-slate-100 mb-5 tracking-tight">Wellness Score</h2>

      <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-6">
        <div className="flex justify-center sm:justify-start shrink-0">
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#1e293b" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke={rc}
                strokeWidth="10"
                strokeDasharray={C}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 8px ${rc}88)`, transition: 'all 0.7s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold text-white tabular-nums leading-none">
                {score.total}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">/ 100</span>
              <span className="text-[11px] font-semibold mt-1" style={{ color: rc }}>
                {label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {score.total === 0 && !score.hasWhoopData ? (
            <p className="text-slate-500 text-sm">
              Log food, workouts, and steps — connect WHOOP to unlock recovery and sleep pillars.
            </p>
          ) : null}
          <div className="grid grid-cols-1 gap-2.5">
            {pillars.map((p) => {
              const pct = p.max > 0 ? p.value / p.max : 0
              return (
                <div key={p.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <span className="text-sm">{p.icon}</span>
                      {p.label}
                      {p.locked && (
                        <span className="text-[10px] text-slate-600 ml-1">
                          ·{' '}
                          <Link
                            href={p.hint === 'Connect WHOOP' ? '/whoop' : '/steps'}
                            className="text-indigo-500 hover:text-indigo-400"
                          >
                            {p.hint}
                          </Link>
                        </span>
                      )}
                    </span>
                    <span
                      className={`text-xs font-bold tabular-nums ${
                        p.locked
                          ? 'text-slate-600'
                          : pct >= 0.8
                            ? 'text-emerald-400'
                            : pct >= 0.5
                              ? 'text-amber-400'
                              : 'text-rose-400'
                      }`}
                    >
                      {p.value}/{p.max}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-700/80 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${
                        p.locked ? 'from-slate-700 to-slate-600' : barColor(pct)
                      }`}
                      style={{ width: `${pct * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-600 leading-relaxed">
        Recovery & sleep from WHOOP · Activity = workouts this week + yesterday&apos;s strain ·
        Nutrition = calories vs target · Steps = today vs 10k · Consistency = days logged this week.
      </p>
    </div>
  )
}
