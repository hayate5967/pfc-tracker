'use client'

import Link from 'next/link'
import { ChevronRight, UtensilsCrossed, Trash2 } from 'lucide-react'
import type { Food } from '@/types'

interface Props {
  food: Food
  imageUrl?: string
  imageCount?: number
  onDelete?: () => void
}

export function FoodCard({ food, imageUrl, imageCount, onDelete }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Link href={`/foods/${food.id}`} className="flex-1 min-w-0">
        <div className="flex items-center gap-3 rounded-xl border bg-card p-3 hover:bg-muted/50 transition-colors">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={food.name}
              className="w-14 h-14 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{food.name}</p>
            <p className="text-xs text-muted-foreground">
              {food.calorie_per100g}kcal / 100g
            </p>
            <p className="text-xs text-muted-foreground">
              P:{food.protein_per100g}g F:{food.fat_per100g}g C:{food.carb_per100g}g
            </p>
            {imageCount !== undefined && (
              <p className="text-xs text-muted-foreground">登録画像: {imageCount}枚</p>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
      </Link>
      {onDelete && (
        <button
          onClick={onDelete}
          className="shrink-0 p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
