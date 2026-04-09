/**
 * Most recently completed calendar week: Sunday 00:00 → Saturday 23:59:59 (local time).
 * Used for the "Sunday morning" weekly review of the week that just ended.
 */
export function getLastCompletedSunSatWeek(now = new Date()): {
  start: Date
  end: Date
} {
  const day = now.getDay() // 0 Sun … 6 Sat
  const daysSinceSat = day === 6 ? 0 : day + 1

  const end = new Date(now)
  end.setDate(end.getDate() - daysSinceSat)
  end.setHours(23, 59, 59, 999)

  const start = new Date(end)
  start.setDate(start.getDate() - 6)
  start.setHours(0, 0, 0, 0)

  return { start, end }
}

export function isSundayMorningWindow(now = new Date()): boolean {
  return now.getDay() === 0 && now.getHours() >= 6
}
