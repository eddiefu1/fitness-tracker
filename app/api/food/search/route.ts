import { NextRequest, NextResponse } from 'next/server'
import { searchFatSecretFoods } from '@/lib/fatsecretSearch'
import { searchOpenFoodFacts } from '@/lib/openFoodFactsSearch'

/**
 * Food search: FatSecret when credentials exist (and DISABLE_FATSECRET is not set),
 * otherwise Open Food Facts only—safe for Vercel without any FatSecret env vars.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q) {
    return NextResponse.json({ results: [], source: null as string | null })
  }

  const fs = await searchFatSecretFoods(q)
  if (fs && fs.length > 0) {
    return NextResponse.json({ results: fs, source: 'fatsecret' as const })
  }

  const off = await searchOpenFoodFacts(q)
  return NextResponse.json({
    results: off,
    source: 'openfoodfacts' as const,
  })
}
