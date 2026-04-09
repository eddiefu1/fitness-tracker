import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const refresh = cookies().get('whoop_refresh_token')?.value
  return NextResponse.json({ connected: Boolean(refresh) })
}
