import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const refresh = cookies().get('withings_refresh_token')?.value
  const uid = cookies().get('withings_userid')?.value
  const connected = Boolean(refresh && uid)
  return NextResponse.json({ connected })
}
