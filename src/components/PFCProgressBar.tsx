'use client'

import { Progress } from '@/components/ui/progress'
import type { PFCTotals, UserGoals } from '@/types'

interface Props {
  totals: PFCTotals
  goals: UserGoals | null
}

interface RowProps {
  label: string
  value: number
  target: number | null
  unit: string
  color: string
}

function Row({ label, value, target, unit, color }: RowProps) {
  const pct = target ? Math.min((value / target) * 100, 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {value.toFixed(1)}{unit}
          {target ? ` / ${target}${unit}` : ''}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function PFCProgressBar({ totals, goals }: Props) {
  return (
    <div className="space-y-3">
      <Row
        label="カロリー"
        value={totals.calories}
        target={goals?.target_calories ?? null}
        unit="kcal"
        color="bg-orange-400"
      />
      <Row
        label="たんぱく質"
        value={totals.protein_g}
        target={goals?.target_protein_g ?? null}
        unit="g"
        color="bg-blue-400"
      />
      <Row
        label="脂質"
        value={totals.fat_g}
        target={goals?.target_fat_g ?? null}
        unit="g"
        color="bg-yellow-400"
      />
      <Row
        label="炭水化物"
        value={totals.carb_g}
        target={goals?.target_carb_g ?? null}
        unit="g"
        color="bg-green-400"
      />
    </div>
  )
}
