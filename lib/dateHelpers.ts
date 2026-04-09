/** Local calendar day key YYYY-MM-DD for comparisons */
export function localDateKey(ms: number): string {
  const d = new Date(ms)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function localDateKeyNow(): string {
  return localDateKey(Date.now())
}

export function parseEntryDateMs(iso: string): number {
  const t = Date.parse(iso)
  return Number.isFinite(t) ? t : Date.parse(iso + 'T12:00:00')
}
