import { NextResponse } from 'next/server'
import { ensureWithingsAccess, applyWithingsCookies } from '@/lib/withings/ensure'
import { fetchWeightMeasurements } from '@/lib/withings/meas'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Default history window: ~3 years */
const HISTORY_SECONDS = 60 * 60 * 24 * 365 * 3

export async function POST() {
  const session = await ensureWithingsAccess()
  if (!session.ok) {
    return NextResponse.json({ ok: false, error: session.error }, { status: 401 })
  }

  const end = Math.floor(Date.now() / 1000)
  const start = end - HISTORY_SECONDS

  const meas = await fetchWeightMeasurements(
    session.accessToken,
    session.userid,
    start,
    end
  )

  if (!meas.ok) {
    return NextResponse.json({ ok: false, error: meas.error }, { status: 502 })
  }

  const res = NextResponse.json({
    ok: true,
    imported: meas.rows.length,
    measurements: meas.rows,
  })

  if (session.cookieUpdates) {
    applyWithingsCookies(res, session.cookieUpdates)
  }

  return res
}
