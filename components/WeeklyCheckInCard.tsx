'use client'

import { useMemo, useState } from 'react'
import { storage } from '@/lib/storage'
import { buildWeeklyCheckIn } from '@/lib/weeklyCheckIn'
import { getLastCompletedSunSatWeek } from '@/lib/weekBounds'

type Props = {
  /** When true, show a Sunday-style intro line */
  emphasizeSunday?: boolean
}

export default function WeeklyCheckInCard({ emphasizeSunday }: Props) {
  const [tick, setTick] = useState(0)

  const report = useMemo(() => {
    void tick
    const { start, end } = getLastCompletedSunSatWeek()
    return buildWeeklyCheckIn(
      storage.getFoodEntries(),
      storage.getWeightEntries(),
      storage.getWorkouts(),
      start,
      end
    )
  }, [tick])

  return (
    <div className="bg-gradient-to-br from-indigo-900/40 to-slate-800 rounded-2xl p-6 border border-indigo-500/30 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span aria-hidden>📅</span> Weekly check-in
            {emphasizeSunday && (
              <span className="text-xs font-normal text-indigo-300 bg-indigo-600/40 px-2 py-0.5 rounded-full">
                Sunday update
              </span>
            )}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Last completed week (Sun–Sat): {report.weekLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setTick((t) => t + 1)}
          className="text-sm text-indigo-300 hover:text-white px-3 py-1.5 rounded-lg border border-indigo-500/40"
        >
          Refresh
        </button>
      </div>
      <div className="space-y-4">
        {report.sections.map((s) => (
          <div key={s.title}>
            <h3 className="text-sm font-medium text-indigo-200 mb-1.5">{s.title}</h3>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
              {s.content}
            </p>
          </div>
        ))}
      </div>
      <p className="text-slate-500 text-xs mt-4">
        Open this app on Sunday mornings for a fresh week review. Not medical advice.
      </p>
    </div>
  )
}
