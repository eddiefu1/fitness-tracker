import nodemailer from 'nodemailer'

export type SendResult = { ok: true } | { ok: false; error: string }

export type SendDailyDigestOptions = {
  /** If true, subject and body indicate a manual test (not the scheduled cron). */
  test?: boolean
}

/**
 * Sends a daily check-in email via Gmail SMTP (App Password).
 * Personalized stats require server-side data; this email links to the app where logs live.
 */
export async function sendDailyDigestEmail(
  options?: SendDailyDigestOptions
): Promise<SendResult> {
  const isTest = options?.test === true
  if (process.env.DAILY_EMAIL_ENABLED === 'false') {
    return { ok: false, error: 'Daily email disabled (DAILY_EMAIL_ENABLED=false)' }
  }

  const user = process.env.GMAIL_USER?.trim()
  /** App Passwords are 16 chars; Google often shows them with spaces between groups — strip all whitespace. */
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '')
  const to = (process.env.EMAIL_TO || user)?.trim()

  if (!user || !pass || !to) {
    return {
      ok: false,
      error:
        'Missing GMAIL_USER, GMAIL_APP_PASSWORD, or EMAIL_TO. See .env.example.',
    }
  }

  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ).replace(/\/$/, '')

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })

  const when = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const subject = isTest
    ? `FitTracker — [TEST] Daily check-in (${when})`
    : `FitTracker — Daily check-in (${when})`

  const testBanner = isTest
    ? `<p style="background:#fef3c7;border:1px solid #f59e0b;padding:12px 14px;border-radius:8px;color:#92400e;font-size:14px;"><strong>Test email</strong> — Sent manually (e.g. npm run email:test). The scheduled cron uses the same template without this banner.</p>`
    : ''

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: system-ui, sans-serif; color: #0f172a; max-width: 560px; line-height: 1.5;">
  ${testBanner}
  <h1 style="color: #1e3a8a; font-size: 20px;">Daily check-in</h1>
  <p>Time for a quick look at your FitTracker.</p>
  <p><strong>Note:</strong> Your meals, weight, and workouts are stored in your browser on your device. Open the app to see if you&apos;re on track on the Dashboard and Weekly Summary.</p>
  <p style="margin: 24px 0;">
    <a href="${appUrl}/dashboard" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600;">Open Dashboard</a>
    &nbsp;&nbsp;
    <a href="${appUrl}/summary" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600;">Weekly Summary</a>
  </p>
  <p style="color:#64748b;font-size:14px;">Food journal: ${appUrl}/food · Workouts: ${appUrl}/workouts</p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
  <p style="color:#94a3b8;font-size:12px;">You get this because daily email is enabled on this deployment. Disable with DAILY_EMAIL_ENABLED=false.</p>
</body>
</html>`

  const text = [
    isTest
      ? `[TEST] FitTracker daily check-in — ${when}\n(Manual test send — not scheduled cron.)`
      : `FitTracker daily check-in — ${when}`,
    '',
    `Dashboard: ${appUrl}/dashboard`,
    `Weekly Summary: ${appUrl}/summary`,
    '',
    'Your data stays in your browser; open the app to review progress.',
  ].join('\n')

  try {
    await transporter.sendMail({
      from: `"FitTracker" <${user}>`,
      to,
      subject,
      text,
      html,
    })
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Send failed'
    console.error('sendDailyDigestEmail:', e)
    return { ok: false, error: msg }
  }
}
