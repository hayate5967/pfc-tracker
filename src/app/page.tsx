'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PFCProgressBar } from '@/components/PFCProgressBar'
import { MealLogItem } from '@/components/MealLogItem'
import { supabase } from '@/lib/supabase'
import { sumPFC } from '@/lib/pfc'
import { toast } from 'sonner'
import type { MealLog, UserGoals, PFCTotals } from '@/types'

export default function DashboardPage() {
  const [logs, setLogs] = useState<MealLog[]>([])
  const [goals, setGoals] = useState<UserGoals | null>(null)
  const [totals, setTotals] = useState<PFCTotals>({ protein_g: 0, fat_g: 0, carb_g: 0, calories: 0 })
  const [loading, setLoading] = useState(true)

  const todayStr = new Date().toISOString().slice(0, 10)

  async function load() {
    const start = `${todayStr}T00:00:00`
    const end = `${todayStr}T23:59:59`

    const [{ data: logData }, { data: goalsData }] = await Promise.all([
      supabase
        .from('meal_logs')
        .select('*, food:foods(*)')
        .gte('logged_at', start)
        .lte('logged_at', end)
        .order('logged_at', { ascending: false }),
      supabase.from('user_goals').select('*').limit(1).maybeSingle(),
    ])

    const todayLogs = (logData ?? []) as MealLog[]
    setLogs(todayLogs)
    setGoals(goalsData)
    setTotals(sumPFC(todayLogs))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string) => {
    await supabase.from('meal_logs').delete().eq('id', id)
    toast.success('削除しました')
    load()
  }

  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{today}</p>
          <h1 className="text-xl font-bold">今日の記録</h1>
        </div>
        <Link href="/log">
          <Button>
            <Camera className="h-4 w-4 mr-2" />
            記録する
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">今日の進捗</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">読み込み中...</p>
          ) : (
            <PFCProgressBar totals={totals} goals={goals} />
          )}
        </CardContent>
      </Card>

      <div className="space-y-1">
        <h2 className="text-sm font-semibold">今日の食事</h2>
        {!loading && logs.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            まだ記録がありません
          </p>
        )}
        {logs.length > 0 && (
          <div className="border rounded-lg px-3 bg-card">
            {logs.map((log) => (
              <MealLogItem key={log.id} log={log} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
