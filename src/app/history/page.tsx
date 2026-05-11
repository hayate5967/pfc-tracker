'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { MealLogItem } from '@/components/MealLogItem'
import { toast } from 'sonner'
import type { MealLog } from '@/types'

interface DayGroup {
  date: string
  logs: MealLog[]
  totalCalories: number
}

export default function HistoryPage() {
  const [groups, setGroups] = useState<DayGroup[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase
      .from('meal_logs')
      .select('*, food:foods(*)')
      .order('logged_at', { ascending: false })
      .limit(200)
    if (!data) return

    const map = new Map<string, MealLog[]>()
    for (const log of data) {
      const date = log.logged_at.slice(0, 10)
      if (!map.has(date)) map.set(date, [])
      map.get(date)!.push(log as MealLog)
    }
    const grouped: DayGroup[] = Array.from(map.entries()).map(([date, logs]) => ({
      date,
      logs,
      totalCalories: logs.reduce((s, l) => s + l.calories, 0),
    }))
    setGroups(grouped)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string) => {
    await supabase.from('meal_logs').delete().eq('id', id)
    toast.success('削除しました')
    load()
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold">食事履歴</h1>

      {loading && <p className="text-muted-foreground text-sm">読み込み中...</p>}

      {!loading && groups.length === 0 && (
        <p className="text-muted-foreground text-sm py-8 text-center">記録がありません</p>
      )}

      {groups.map(({ date, logs, totalCalories }) => (
        <div key={date} className="space-y-1">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold">{formatDate(date)}</h2>
            <span className="text-xs text-muted-foreground">{totalCalories.toFixed(0)} kcal</span>
          </div>
          <div className="border rounded-lg px-3 bg-card">
            {logs.map((log) => (
              <MealLogItem key={log.id} log={log} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
