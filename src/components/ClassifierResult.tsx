'use client'

import { CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ClassificationResult } from '@/types'

interface Props {
  result: ClassificationResult
}

export function ClassifierResult({ result }: Props) {
  const pct = Math.round(result.similarity * 100)
  return (
    <Card className="p-3 flex items-center gap-3">
      <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
      <div className="flex-1">
        <p className="font-medium">{result.food.name}</p>
        <p className="text-xs text-muted-foreground">
          {result.food.calorie_per100g}kcal/100g
        </p>
      </div>
      <Badge variant="secondary">{pct}%</Badge>
    </Card>
  )
}
