export type Database = {
  public: {
    Tables: {
      foods: {
        Row: {
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
        Insert: {
          id?: string
          name: string
          protein_per100g: number
          fat_per100g: number
          carb_per100g: number
          calorie_per100g: number
          weight_mode: 'fixed' | 'options'
          fixed_weight?: number | null
          weight_options?: number[] | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          protein_per100g?: number
          fat_per100g?: number
          carb_per100g?: number
          calorie_per100g?: number
          weight_mode?: 'fixed' | 'options'
          fixed_weight?: number | null
          weight_options?: number[] | null
          created_at?: string
        }
      }
      food_images: {
        Row: {
          id: string
          food_id: string
          image_url: string
          embedding: number[]
          created_at: string
        }
        Insert: {
          id?: string
          food_id: string
          image_url: string
          embedding: number[]
          created_at?: string
        }
        Update: {
          id?: string
          food_id?: string
          image_url?: string
          embedding?: number[]
          created_at?: string
        }
      }
      meal_logs: {
        Row: {
          id: string
          food_id: string
          weight_g: number
          protein_g: number
          fat_g: number
          carb_g: number
          calories: number
          logged_at: string
        }
        Insert: {
          id?: string
          food_id: string
          weight_g: number
          protein_g: number
          fat_g: number
          carb_g: number
          calories: number
          logged_at?: string
        }
        Update: {
          id?: string
          food_id?: string
          weight_g?: number
          protein_g?: number
          fat_g?: number
          carb_g?: number
          calories?: number
          logged_at?: string
        }
      }
      user_goals: {
        Row: {
          id: string
          target_calories: number | null
          target_protein_g: number | null
          target_fat_g: number | null
          target_carb_g: number | null
          updated_at: string
        }
        Insert: {
          id?: string
          target_calories?: number | null
          target_protein_g?: number | null
          target_fat_g?: number | null
          target_carb_g?: number | null
          updated_at?: string
        }
        Update: {
          id?: string
          target_calories?: number | null
          target_protein_g?: number | null
          target_fat_g?: number | null
          target_carb_g?: number | null
          updated_at?: string
        }
      }
    }
  }
}
