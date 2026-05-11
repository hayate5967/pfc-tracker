'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CameraCapture } from '@/components/CameraCapture'
import { WeightSelector } from '@/components/WeightSelector'
import { supabase } from '@/lib/supabase'
import { detectAndClassify } from '@/lib/classifier'
import { calcPFC } from '@/lib/pfc'
import { toast } from 'sonner'
import type { ClassificationResult, Food, FoodImage } from '@/types'

type Step = 'capture' | 'detecting' | 'confirm' | 'saving'

interface DetectedItem {
  result: ClassificationResult
  weightG: number | null
}

export default function LogPage() {
  const router = useRouter()
  const [foods, setFoods] = useState<Food[]>([])
  const [foodImages, setFoodImages] = useState<FoodImage[]>([])
  const [step, setStep] = useState<Step>('capture')
  const [items, setItems] = useState<DetectedItem[]>([])

  useEffect(() => {
    async function load() {
      const [{ data: f }, { data: imgs }] = await Promise.all([
        supabase.from('foods').select('*'),
        supabase.from('food_images').select('*'),
      ])
      setFoods((f ?? []) as Food[])
      setFoodImages((imgs ?? []) as FoodImage[])
    }
    load()
  }, [])

  const handleCapture = async (_dataUrl: string, element: HTMLImageElement) => {
    if (foods.length === 0) {
      toast.error('先に食べ物を登録してください')
      router.push('/foods/new')
      return
    }
    setStep('detecting')
    try {
      const results = await detectAndClassify(element, foods, foodImages)
      if (results.length === 0) {
        toast.error('食べ物を検出できませんでした')
        setStep('capture')
        return
      }
      setItems(results.map((r) => ({ result: r, weightG: null })))
      setStep('confirm')
    } catch (err) {
      console.error(err)
      toast.error('検出中にエラーが発生しました')
      setStep('capture')
    }
  }

  const setWeight = (index: number, weightG: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, weightG } : item))
    )
  }

  const allWeightsSelected = items.every((item) => item.weightG !== null)

  const handleSave = async () => {
    if (!allWeightsSelected) {
      toast.error('すべての食べ物の重さを選択してください')
      return
    }
    setStep('saving')
    try {
      const rows = items.map(({ result, weightG }) => {
        const pfc = calcPFC(result.food, weightG!)
        return { food_id: result.food.id, weight_g: weightG!, ...pfc }
      })
      await supabase.from('meal_logs').insert(rows)
      toast.success(`${rows.length}品を記録しました`)
      router.push('/')
    } catch {
      toast.error('保存に失敗しました')
      setStep('confirm')
    }
  }

  if (step === 'detecting') {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm text-center">
          食べ物を検出中...
          <br />
          <span className="text-xs">（初回はモデル読み込みに10〜20秒かかります）</span>
        </p>
      </div>
    )
  }

  if (step === 'saving') {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">記録中...</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto">
      <h1 className="text-xl font-bold">食事を記録</h1>

      {step === 'capture' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            食事の写真を撮ると、映っている食べ物をすべて自動検出します
          </p>
          <CameraCapture onCapture={handleCapture} label="カメラを起動" />
          {foods.length === 0 && (
            <Card className="p-4 text-center space-y-3">
              <p className="text-sm text-muted-foreground">食べ物が登録されていません</p>
              <Button size="sm" onClick={() => router.push('/foods/new')}>
                食べ物を登録する
              </Button>
            </Card>
          )}
        </div>
      )}

      {step === 'confirm' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {items.length}品を検出しました。重さを選択してください。
          </p>

          {items.map(({ result, weightG }, i) => (
            <Card key={result.food.id} className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                {weightG !== null && (
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{result.food.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {result.food.calorie_per100g}kcal/100g
                  </p>
                </div>
                <Badge variant="secondary">
                  {Math.round(result.similarity * 100)}%
                </Badge>
              </div>
              <WeightSelector food={result.food} onSelect={(w) => setWeight(i, w)} />
            </Card>
          ))}

          <Button
            className="w-full"
            onClick={handleSave}
            disabled={!allWeightsSelected}
          >
            {allWeightsSelected
              ? `${items.length}品をまとめて記録`
              : `重さを選択してください（${items.filter((i) => i.weightG !== null).length}/${items.length}）`}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => { setItems([]); setStep('capture') }}
          >
            撮り直す
          </Button>
        </div>
      )}
    </div>
  )
}
