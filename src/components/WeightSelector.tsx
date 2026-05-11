'use client'

import { Button } from '@/components/ui/button'
import type { Food } from '@/types'

interface Props {
  food: Food
  onSelect: (weightG: number) => void
}

export function WeightSelector({ food, onSelect }: Props) {
  if (food.weight_mode === 'fixed' && food.fixed_weight) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">重さ（固定）</p>
        <Button className="w-full" onClick={() => onSelect(food.fixed_weight!)}>
          {food.fixed_weight}g で記録
        </Button>
      </div>
    )
  }

  const options = food.weight_options ?? []
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">重さを選択</p>
      <div className="grid grid-cols-3 gap-2">
        {options.map((w) => (
          <Button key={w} variant="outline" onClick={() => onSelect(w)}>
            {w}g
          </Button>
        ))}
      </div>
    </div>
  )
}
