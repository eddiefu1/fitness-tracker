import type { FoodSearchItem } from '@/lib/foodSearchTypes'

type OffProduct = {
  product_name?: string
  nutriments?: {
    'energy-kcal_100g'?: number
    'energy-kcal_serving'?: number
    proteins_100g?: number
    carbohydrates_100g?: number
    fat_100g?: number
  }
  serving_size?: string
  brands?: string
}

export async function searchOpenFoodFacts(
  query: string,
  pageSize = 10
): Promise<FoodSearchItem[]> {
  const res = await fetch(
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${pageSize}`
  )
  if (!res.ok) return []

  const data = (await res.json()) as { products?: OffProduct[] }
  const products = (data.products || []).filter((p) => p.product_name)

  return products.map((p, i) => {
    const n = p.nutriments ?? {}
    const cal =
      n['energy-kcal_100g'] ?? n['energy-kcal_serving'] ?? 0
    const brand = p.brands?.split(',')[0]?.trim()
    return {
      source: 'openfoodfacts' as const,
      id: `off-${i}-${p.product_name?.slice(0, 40) ?? i}`,
      name: p.product_name ?? 'Food',
      brandName: brand,
      calories: Math.round(cal),
      protein: Math.round(n.proteins_100g ?? 0),
      carbs: Math.round(n.carbohydrates_100g ?? 0),
      fat: Math.round(n.fat_100g ?? 0),
      servingSize: p.serving_size || 'per 100g',
    }
  })
}
