/** Unified food search row for FatSecret + Open Food Facts. */
export type FoodSearchItem = {
  source: 'fatsecret' | 'openfoodfacts'
  id: string
  name: string
  brandName?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  servingSize: string
}
