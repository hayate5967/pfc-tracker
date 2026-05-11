'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { MealLog } from '@/types'

interface Props {
  log: MealLog
  onDelete?: (id: string) => void
}

export function MealLogItem({ log, onDelete }: Props) {
  const time = new Date(log.logged_at).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{time}</span>
          <span className="font-medium truncate">{log.food?.name ?? '不明'}</span>
          <span className="text-xs text-muted-foreground">{log.weight_g}g</span>
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
          <span>{log.calories.toFixed(0)}kcal</span>
          <span>P:{log.protein_g.toFixed(1)}g</span>
          <span>F:{log.fat_g.toFixed(1)}g</span>
          <span>C:{log.carb_g.toFixed(1)}g</span>
        </div>
      </div>
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(log.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
