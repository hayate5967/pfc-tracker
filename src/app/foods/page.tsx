'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FoodCard } from '@/components/FoodCard'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Food } from '@/types'

export default function FoodsPage() {
  const [foods, setFoods] = useState<Food[]>([])
  const [imageMeta, setImageMeta] = useState<Record<string, { count: number; url: string | null }>>({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data: foodData } = await supabase
      .from('foods')
      .select('*')
      .order('created_at', { ascending: false })
    if (!foodData) return

    const { data: imgData } = await supabase
      .from('food_images')
      .select('food_id, image_url')
      .order('created_at', { ascending: true })

    const meta: Record<string, { count: number; url: string | null }> = {}
    imgData?.forEach((r: { food_id: string; image_url: string }) => {
      if (!meta[r.food_id]) meta[r.food_id] = { count: 0, url: r.image_url }
      meta[r.food_id].count += 1
    })

    setFoods(foodData as Food[])
    setImageMeta(meta)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (food: Food) => {
    if (!confirm(`「${food.name}」を削除しますか？`)) return
    await supabase.from('foods').delete().eq('id', food.id)
    toast.success('削除しました')
    load()
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">食べ物一覧</h1>
        <Link href="/foods/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            追加
          </Button>
        </Link>
      </div>

      {loading && <p className="text-muted-foreground text-sm">読み込み中...</p>}

      {!loading && foods.length === 0 && (
        <div className="text-center py-12 space-y-3">
          <p className="text-muted-foreground">食べ物が登録されていません</p>
          <Link href="/foods/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              最初の食べ物を登録する
            </Button>
          </Link>
        </div>
      )}

      <div className="space-y-2">
        {foods.map((food) => (
          <FoodCard
            key={food.id}
            food={food}
            imageUrl={imageMeta[food.id]?.url ?? undefined}
            imageCount={imageMeta[food.id]?.count ?? 0}
            onDelete={() => handleDelete(food)}
          />
        ))}
      </div>
    </div>
  )
}
