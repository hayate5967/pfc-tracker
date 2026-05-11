'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { CameraCapture } from '@/components/CameraCapture'
import { supabase, STORAGE_BUCKET } from '@/lib/supabase'
import { extractEmbedding } from '@/lib/classifier'
import { toast } from 'sonner'

type WeightMode = 'fixed' | 'options'

interface CapturedImage {
  dataUrl: string
  element: HTMLImageElement
}

function normalize(value: string, baseWeight: number): number {
  return (parseFloat(value) / baseWeight) * 100
}

export default function NewFoodPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [baseWeight, setBaseWeight] = useState('100')
  const [protein, setProtein] = useState('')
  const [fat, setFat] = useState('')
  const [carb, setCarb] = useState('')
  const [calorie, setCalorie] = useState('')
  const [weightMode, setWeightMode] = useState<WeightMode>('fixed')
  const [fixedWeight, setFixedWeight] = useState('')
  const [weightOptions, setWeightOptions] = useState<string[]>(['100'])
  const [images, setImages] = useState<CapturedImage[]>([])
  const [saving, setSaving] = useState(false)

  const addWeightOption = () => setWeightOptions((prev) => [...prev, ''])
  const removeWeightOption = (i: number) =>
    setWeightOptions((prev) => prev.filter((_, idx) => idx !== i))
  const updateWeightOption = (i: number, val: string) =>
    setWeightOptions((prev) => prev.map((v, idx) => (idx === i ? val : v)))

  const handleCapture = (dataUrl: string, element: HTMLImageElement) => {
    setImages((prev) => [...prev, { dataUrl, element }])
  }

  const removeImage = (i: number) =>
    setImages((prev) => prev.filter((_, idx) => idx !== i))

  const handleSave = async () => {
    if (!name.trim()) return toast.error('名前を入力してください')
    if (!protein || !fat || !carb || !calorie) return toast.error('PFC・カロリーをすべて入力してください')
    if (!baseWeight || parseFloat(baseWeight) <= 0) return toast.error('基準重量を正しく入力してください')
    if (images.length === 0) return toast.error('写真を1枚以上撮影してください')
    if (weightMode === 'fixed' && !fixedWeight) return toast.error('固定重量を入力してください')
    if (weightMode === 'options' && weightOptions.every((w) => !w)) return toast.error('重さの選択肢を入力してください')

    const base = parseFloat(baseWeight)
    setSaving(true)
    try {
      const { data: food, error: foodErr } = await supabase
        .from('foods')
        .insert({
          name: name.trim(),
          protein_per100g: normalize(protein, base),
          fat_per100g: normalize(fat, base),
          carb_per100g: normalize(carb, base),
          calorie_per100g: normalize(calorie, base),
          weight_mode: weightMode,
          fixed_weight: weightMode === 'fixed' ? parseFloat(fixedWeight) : null,
          weight_options: weightMode === 'options'
            ? weightOptions.filter(Boolean).map(Number)
            : null,
        })
        .select()
        .single()
      if (foodErr || !food) throw foodErr

      for (const img of images) {
        const embedding = await extractEmbedding(img.element)
        const filename = `${food.id}/${crypto.randomUUID()}.jpg`
        const blob = await fetch(img.dataUrl).then((r) => r.blob())
        const { error: uploadErr } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filename, blob, { contentType: 'image/jpeg' })
        if (uploadErr) throw uploadErr

        const { data: urlData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(filename)

        await supabase.from('food_images').insert({
          food_id: food.id,
          image_url: urlData.publicUrl,
          embedding,
        })
      }

      toast.success('登録しました')
      router.push('/foods')
    } catch (err) {
      console.error(err)
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      toast.error(`保存に失敗しました: ${msg}`, { duration: 10000 })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto">
      <h1 className="text-xl font-bold">食べ物を登録</h1>

      <div className="space-y-2">
        <Label>名前</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例：ご飯" />
      </div>

      <Card className="p-3 space-y-3">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={baseWeight}
            onChange={(e) => setBaseWeight(e.target.value)}
            className="w-20 text-center"
          />
          <p className="text-sm font-medium">g あたりの栄養素</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">たんぱく質 (g)</Label>
            <Input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">脂質 (g)</Label>
            <Input type="number" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">炭水化物 (g)</Label>
            <Input type="number" value={carb} onChange={(e) => setCarb(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">カロリー (kcal)</Label>
            <Input type="number" value={calorie} onChange={(e) => setCalorie(e.target.value)} placeholder="0" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">※ 保存時に100gあたりの値に自動換算されます</p>
      </Card>

      <Card className="p-3 space-y-3">
        <p className="text-sm font-medium">重さの設定</p>
        <div className="flex gap-3">
          <Button
            variant={weightMode === 'fixed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setWeightMode('fixed')}
          >固定</Button>
          <Button
            variant={weightMode === 'options' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setWeightMode('options')}
          >ボタン選択</Button>
        </div>

        {weightMode === 'fixed' && (
          <div className="space-y-1">
            <Label className="text-xs">重さ (g)</Label>
            <Input
              type="number"
              value={fixedWeight}
              onChange={(e) => setFixedWeight(e.target.value)}
              placeholder="例：150"
            />
          </div>
        )}

        {weightMode === 'options' && (
          <div className="space-y-2">
            {weightOptions.map((w, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  type="number"
                  value={w}
                  onChange={(e) => updateWeightOption(i, e.target.value)}
                  placeholder="例：100"
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">g</span>
                {weightOptions.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeWeightOption(i)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addWeightOption}>
              <Plus className="h-4 w-4 mr-1" />
              選択肢を追加
            </Button>
          </div>
        )}
      </Card>

      <div className="space-y-2">
        <p className="text-sm font-medium">写真を登録（1枚以上）</p>
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.dataUrl} alt="" className="w-full aspect-square object-cover rounded-lg" />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
        <CameraCapture onCapture={handleCapture} label="写真を撮る" />
      </div>

      <Button className="w-full" onClick={handleSave} disabled={saving}>
        {saving ? '保存中...' : '登録する'}
      </Button>
    </div>
  )
}
