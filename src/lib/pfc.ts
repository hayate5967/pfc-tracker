import type { Food, PFCTotals } from '@/types'

export function calcPFC(food: Food, weightG: number): PFCTotals {
  const ratio = weightG / 100
  return {
    protein_g: Math.round(food.protein_per100g * ratio * 10) / 10,
    fat_g: Math.round(food.fat_per100g * ratio * 10) / 10,
    carb_g: Math.round(food.carb_per100g * ratio * 10) / 10,
    calories: Math.round(food.calorie_per100g * ratio * 10) / 10,
  }
}

export function sumPFC(items: PFCTotals[]): PFCTotals {
  return items.reduce(
    (acc, item) => ({
      protein_g: acc.protein_g + item.protein_g,
      fat_g: acc.fat_g + item.fat_g,
      carb_g: acc.carb_g + item.carb_g,
      calories: acc.calories + item.calories,
    }),
    { protein_g: 0, fat_g: 0, carb_g: 0, calories: 0 }
  )
}
