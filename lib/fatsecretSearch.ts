import { getFatSecretAccessToken } from '@/lib/fatsecret'
import type { FoodSearchItem } from '@/lib/foodSearchTypes'

type RawServing = {
  serving_id?: string
  serving_description?: string
  is_default?: string
  calories?: string
  carbohydrate?: string
  protein?: string
  fat?: string
}

type RawFood = {
  food_id?: string
  food_name?: string
  brand_name?: string
  servings?: { serving?: RawServing | RawServing[] }
}

function asArray<T>(x: T | T[] | undefined | null): T[] {
  if (x == null) return []
  return Array.isArray(x) ? x : [x]
}

function num(s: string | undefined): number {
  if (s == null || s === '') return 0
  const n = Number.parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

function pickServing(servings: RawServing[]): RawServing | null {
  if (servings.length === 0) return null
  const def = servings.find((s) => s.is_default === '1')
  return def ?? servings[0]
}

function displayName(food: RawFood): { name: string; brandName?: string } {
  const fn = food.food_name?.trim() || 'Unknown food'
  const bn = food.brand_name?.trim()
  if (bn) return { name: `${bn} — ${fn}`, brandName: bn }
  return { name: fn }
}

export async function searchFatSecretFoods(
  query: string,
  maxResults = 15
): Promise<FoodSearchItem[] | null> {
  const token = await getFatSecretAccessToken()
  if (!token) return null

  const url = new URL('https://platform.fatsecret.com/rest/foods/search/v2')
  url.searchParams.set('search_expression', query)
  url.searchParams.set('max_results', String(Math.min(maxResults, 50)))
  url.searchParams.set('format', 'json')
  url.searchParams.set('flag_default_serving', 'true')

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    console.error('FatSecret foods.search:', res.status, await res.text())
    return null
  }

  const json = (await res.json()) as {
    foods_search?: {
      results?: { food?: RawFood | RawFood[] }
    }
  }

  const foods = asArray(json.foods_search?.results?.food)
  const out: FoodSearchItem[] = []

  for (const food of foods) {
    const servings = asArray(food.servings?.serving)
    const s = pickServing(servings)
    if (!s) continue

    const { name, brandName } = displayName(food)
    const fid = food.food_id ?? '0'
    const sid = s.serving_id ?? '0'
    out.push({
      source: 'fatsecret',
      id: `fs-${fid}-${sid}`,
      name,
      brandName,
      calories: Math.round(num(s.calories)),
      protein: Math.round(num(s.protein)),
      carbs: Math.round(num(s.carbohydrate)),
      fat: Math.round(num(s.fat)),
      servingSize: s.serving_description?.trim() || '1 serving',
    })
  }

  return out
}
