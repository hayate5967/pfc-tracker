'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { X, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { CameraCapture } from '@/components/CameraCapture'
import { supabase, STORAGE_BUCKET } from '@/lib/supabase'
import { extractEmbedding } from '@/lib/classifier'
import { toast } from 'sonner'
import type { Food, FoodImage } from '@/types'

type WeightMode = 'fixed' | 'options'

function round1(n: number) { return Math.round(n * 10) / 10 }

export default function EditFoodPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [food, setFood] = useState<Food | null>(null)
  const [images, setImages] = useState<FoodImage[]>([])
  const [name, setName] = useState('')
  const [baseWeight, setBaseWeight] = useState('100')
  const [protein, setProtein] = useState('')
  const [fat, setFat] = useState('')
  const [carb, setCarb] = useState('')
  const [calorie, setCalorie] = useState('')
  const [weightMode, setWeightMode] = useState<WeightMode>('fixed')
  const [fixedWeight, setFixedWeight] = useState('')
  const [weightOptions, setWeightOptions] = useState<string[]>(['100'])
  const [saving, setSaving] = useState(false)

  // DBは常にper100g保存なので、baseWeight変更時に入力値を換算する
  const handleBaseWeightChange = (newBase: string) => {
    const prev = parseFloat(baseWeight) || 100
    const next = parseFloat(newBase) || 100
    const scale = next / prev
    setProtein((v) => v ? String(round1(parseFloat(v) * scale)) : v)
    setFat((v) => v ? String(round1(parseFloat(v) * scale)) : v)
    setCarb((v) => v ? String(round1(parseFloat(v) * scale)) : v)
    setCalorie((v) => v ? String(round1(parseFloat(v) * scale)) : v)
    setBaseWeight(newBase)
  }

  useEffect(() => {
    async function load() {
      const { data: f } = await supabase.from('foods').select('*').eq('id', id).single()
      const { data: imgs } = await supabase.from('food_images').select('*').eq('food_id', id).order('created_at')
      if (!f) return
      const food = f as unknown as Food
      setFood(food)
      setName(food.name)
      setBaseWeight('100')
      setProtein(String(food.protein_per100g))
      setFat(String(food.fat_per100g))
      setCarb(String(food.carb_per100g))
      setCalorie(String(food.calorie_per100g))
      setWeightMode(food.weight_mode)
      setFixedWeight(food.fixed_weight != null ? String(food.fixed_weight) : '')
      setWeightOptions(food.weight_options?.map(String) ?? ['100'])
      setImages((imgs ?? []) as unknown as FoodImage[])
    }
    load()
  }, [id])

  const addWeightOption = () => setWeightOptions((prev) => [...prev, ''])
  const removeWeightOption = (i: number) => setWeightOptions((prev) => prev.filter((_, idx) => idx !== i))
  const updateWeightOption = (i: number, val: string) =>
    setWeightOptions((prev) => prev.map((v, idx) => (idx === i ? val : v)))

  const handleAddImage = async (dataUrl: string, element: HTMLImageElement) => {
    setSaving(true)
    try {
      const embedding = await extractEmbedding(element)
      const filename = `${id}/${crypto.randomUUID()}.jpg`
      const blob = await fetch(dataUrl).then((r) => r.blob())
      await supabase.storage.from(STORAGE_BUCKET).upload(filename, blob, { contentType: 'image/jpeg' })
      const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename)
      const { data: img } = await supabase
        .from('food_images')
        .insert({ food_id: id, image_url: urlData.publicUrl, embedding })
        .select()
        .single()
      if (img) setImages((prev) => [...prev, img as unknown as FoodImage])
      toast.success('画像を追加しました')
    } catch {
      toast.error('画像の追加に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteImage = async (imgId: string) => {
    await supabase.from('food_images').delete().eq('id', imgId)
    setImages((prev) => prev.filter((i) => i.id !== imgId))
    toast.success('削除しました')
  }

  const handleSave = async () => {
    const base = parseFloat(baseWeight) || 100
    const toP100 = (v: string) => (parseFloat(v) / base) * 100
    setSaving(true)
    try {
      await supabase.from('foods').update({
        name: name.trim(),
        protein_per100g: toP100(protein),
        fat_per100g: toP100(fat),
        carb_per100g: toP100(carb),
        calorie_per100g: toP100(calorie),
        weight_mode: weightMode,
        fixed_weight: weightMode === 'fixed' ? parseFloat(fixedWeight) : null,
        weight_options: weightMode === 'options'
          ? weightOptions.filter(Boolean).map(Number)
          : null,
      }).eq('id', id)
      toast.success('保存しました')
    } catch {
      toast.error('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`「${food?.name}」を削除しますか？`)) return
    await supabase.from('foods').delete().eq('id', id)
    toast.success('削除しました')
    router.push('/foods')
    router.refresh()
  }

  if (!food) return <div className="p-4 text-muted-foreground">読み込み中...</div>

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">食べ物を編集</h1>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label>名前</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <Card className="p-3 space-y-3">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={baseWeight}
            onChange={(e) => handleBaseWeightChange(e.target.value)}
            className="w-20 text-center"
          />
          <p className="text-sm font-medium">g あたりの栄養素</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">たんぱく質 (g)</Label>
            <Input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">脂質 (g)</Label>
            <Input type="number" value={fat} onChange={(e) => setFat(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">炭水化物 (g)</Label>
            <Input type="number" value={carb} onChange={(e) => setCarb(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">カロリー (kcal)</Label>
            <Input type="number" value={calorie} onChange={(e) => setCalorie(e.target.value)} />
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
        <p className="text-sm font-medium">登録画像 ({images.length}枚)</p>
        <div className="grid grid-cols-3 gap-2">
          {images.map((img) => (
            <div key={img.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.image_url} alt="" className="w-full aspect-square object-cover rounded-lg" />
              <button
                onClick={() => handleDeleteImage(img.id)}
                className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
        <CameraCapture onCapture={handleAddImage} label="画像を追加" />
      </div>

      <Button className="w-full" onClick={handleSave} disabled={saving}>
        {saving ? '保存中...' : '変更を保存'}
      </Button>
    </div>
  )
}
