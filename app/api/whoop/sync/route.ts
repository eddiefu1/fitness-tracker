import { NextResponse } from 'next/server'
import { applyWhoopCookies, ensureWhoopAccess } from '@/lib/whoop/ensure'
import {
  fetchAllPages,
  fetchWhoopBodyMeasurement,
  fetchWhoopProfile,
} from '@/lib/whoop/api'
import type { WhoopStoredData } from '@/lib/whoop/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST() {
  const session = await ensureWhoopAccess()
  if (!session.ok) {
    return NextResponse.json({ ok: false, error: session.error }, { status: 401 })
  }

  const token = session.accessToken

  const partial: WhoopStoredData = {
    syncedAt: new Date().toISOString(),
    recoveries: [],
    sleeps: [],
    workouts: [],
    cycles: [],
  }

  const errors: string[] = []

  try {
    partial.profile = await fetchWhoopProfile(token)
  } catch (e) {
    errors.push(
      `profile: ${e instanceof Error ? e.message : 'failed'}`
    )
  }

  try {
    partial.bodyMeasurement = await fetchWhoopBodyMeasurement(token)
  } catch (e) {
    errors.push(
      `body: ${e instanceof Error ? e.message : 'failed'}`
    )
  }

  try {
    partial.recoveries = await fetchAllPages('/recovery', token)
  } catch (e) {
    errors.push(`recovery: ${e instanceof Error ? e.message : 'failed'}`)
  }

  try {
    partial.sleeps = await fetchAllPages('/activity/sleep', token)
  } catch (e) {
    errors.push(`sleep: ${e instanceof Error ? e.message : 'failed'}`)
  }

  try {
    partial.workouts = await fetchAllPages('/activity/workout', token)
  } catch (e) {
    errors.push(`workout: ${e instanceof Error ? e.message : 'failed'}`)
  }

  try {
    partial.cycles = await fetchAllPages('/cycle', token)
  } catch (e) {
    errors.push(`cycle: ${e instanceof Error ? e.message : 'failed'}`)
  }

  const res = NextResponse.json({
    ok: true,
    data: partial,
    warnings: errors.length ? errors : undefined,
  })

  if (session.cookieUpdates) {
    applyWhoopCookies(res, session.cookieUpdates)
  }

  return res
}
