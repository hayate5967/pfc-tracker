export interface Food {
  id: string
  name: string
  protein_per100g: number
  fat_per100g: number
  carb_per100g: number
  calorie_per100g: number
  weight_mode: 'fixed' | 'options'
  fixed_weight: number | null
  weight_options: number[] | null
  created_at: string
}

export interface FoodImage {
  id: string
  food_id: string
  image_url: string
  embedding: number[]
  created_at: string
}

export interface MealLog {
  id: string
  food_id: string
  weight_g: number
  protein_g: number
  fat_g: number
  carb_g: number
  calories: number
  logged_at: string
  food?: Food
}

export interface UserGoals {
  id: string
  target_calories: number | null
  target_protein_g: number | null
  target_fat_g: number | null
  target_carb_g: number | null
  updated_at: string
}

export interface PFCTotals {
  protein_g: number
  fat_g: number
  carb_g: number
  calories: number
}

export interface ClassificationResult {
  food: Food
  similarity: number
}
