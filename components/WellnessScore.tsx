'use client'
import { WellnessScore as WellnessScoreType } from '@/lib/wellness'

interface Props {
  score: WellnessScoreType
}

export default function WellnessScore({ score }: Props) {
  const getColor = (value: number, max: number) => {
    const pct = value / max
    if (pct >= 0.8) return 'text-green-400'
    if (pct >= 0.5) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getBarColor = (value: number, max: number) => {
    const pct = value / max
    if (pct >= 0.8) return 'bg-green-500'
    if (pct >= 0.5) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference - (score.total / 100) * circumference

  const scoreColor = score.total >= 80 ? '#22c55e' : score.total >= 50 ? '#eab308' : '#ef4444'

  const components = [
    { label: 'Nutrition', value: score.nutrition, max: 34, icon: '🥗' },
    { label: 'Exercise', value: score.exercise, max: 33, icon: '💪' },
    { label: 'Consistency', value: score.consistency, max: 33, icon: '📅' },
  ]

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
      <h2 className="text-lg font-semibold text-slate-300 mb-4">Wellness Score</h2>
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-36 h-36">
          <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#1e293b" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={scoreColor}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${getColor(score.total, 100)}`}>{score.total}</span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {components.map((comp) => (
          <div key={comp.label}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-slate-300 flex items-center gap-1">
                <span>{comp.icon}</span> {comp.label}
              </span>
              <span className={`text-sm font-semibold ${getColor(comp.value, comp.max)}`}>
                {comp.value}/{comp.max}
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${getBarColor(comp.value, comp.max)} rounded-full transition-all duration-500`}
                style={{ width: `${(comp.value / comp.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
