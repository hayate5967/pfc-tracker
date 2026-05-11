'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { UserGoals } from '@/types'

export default function GoalsPage() {
  const [goals, setGoals] = useState<UserGoals | null>(null)
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [fat, setFat] = useState('')
  const [carb, setCarb] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('user_goals')
        .select('*')
        .limit(1)
        .maybeSingle()
      if (data) {
        setGoals(data)
        setCalories(String(data.target_calories ?? ''))
        setProtein(String(data.target_protein_g ?? ''))
        setFat(String(data.target_fat_g ?? ''))
        setCarb(String(data.target_carb_g ?? ''))
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        target_calories: calories ? parseFloat(calories) : null,
        target_protein_g: protein ? parseFloat(protein) : null,
        target_fat_g: fat ? parseFloat(fat) : null,
        target_carb_g: carb ? parseFloat(carb) : null,
        updated_at: new Date().toISOString(),
      }
      if (goals) {
        await supabase.from('user_goals').update(payload).eq('id', goals.id)
      } else {
        await supabase.from('user_goals').insert(payload)
      }
      toast.success('目標を保存しました')
    } catch {
      toast.error('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto">
      <h1 className="text-xl font-bold">目標設定</h1>
      <p className="text-sm text-muted-foreground">空白のままにすると目標なしになります</p>

      <div className="space-y-4">
        <div className="space-y-1">
          <Label>カロリー目標 (kcal)</Label>
          <Input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="例：2000" />
        </div>
        <div className="space-y-1">
          <Label>たんぱく質目標 (g)</Label>
          <Input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="例：150" />
        </div>
        <div className="space-y-1">
          <Label>脂質目標 (g)</Label>
          <Input type="number" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="例：60" />
        </div>
        <div className="space-y-1">
          <Label>炭水化物目標 (g)</Label>
          <Input type="number" value={carb} onChange={(e) => setCarb(e.target.value)} placeholder="例：250" />
        </div>
      </div>

      <Button className="w-full" onClick={handleSave} disabled={saving}>
        {saving ? '保存中...' : '保存する'}
      </Button>
    </div>
  )
}
