import { NextRequest, NextResponse } from 'next/server'
import { sendDailyDigestEmail } from '@/lib/sendDailyDigestEmail'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Vercel Cron: GET /api/cron/daily-email
 * Secured with Authorization: Bearer CRON_SECRET (set in Vercel env; Vercel injects this for cron).
 */
export async function GET(request: NextRequest) {
  if (process.env.DAILY_EMAIL_ENABLED === 'false') {
    return NextResponse.json({ ok: false, skipped: 'DAILY_EMAIL_ENABLED=false' })
  }

  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } else if (process.env.VERCEL === '1') {
    return NextResponse.json(
      { error: 'Set CRON_SECRET in Vercel environment variables' },
      { status: 500 }
    )
  }

  const result = await sendDailyDigestEmail()
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: 'error' in result ? result.error : 'Unknown' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, sent: true })
}
