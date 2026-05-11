'use client'

import type { ClassificationResult, Food, FoodImage } from '@/types'

type MobileNetModule = typeof import('@tensorflow-models/mobilenet')
type CocoSsdModule = typeof import('@tensorflow-models/coco-ssd')

let mobilenet: Awaited<ReturnType<MobileNetModule['load']>> | null = null
let cocoSsd: Awaited<ReturnType<CocoSsdModule['load']>> | null = null

async function loadMobileNet() {
  if (mobilenet) return mobilenet
  await import('@tensorflow/tfjs')
  const m = await import('@tensorflow-models/mobilenet')
  mobilenet = await m.load({ version: 2, alpha: 1.0 })
  return mobilenet
}

async function loadCocoSsd() {
  if (cocoSsd) return cocoSsd
  await import('@tensorflow/tfjs')
  const m = await import('@tensorflow-models/coco-ssd')
  cocoSsd = await m.load()
  return cocoSsd
}

export async function extractEmbedding(
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<number[]> {
  const mn = await loadMobileNet()
  const tensor = mn.infer(imageElement, true) as unknown as {
    data(): Promise<Float32Array>
    dispose(): void
  }
  const data = await tensor.data()
  tensor.dispose()
  return Array.from(data)
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

function knnClassify(
  queryEmbedding: number[],
  foods: Food[],
  foodImages: FoodImage[]
): ClassificationResult | null {
  if (foods.length === 0 || foodImages.length === 0) return null

  const scoreMap = new Map<string, { total: number; count: number }>()
  for (const img of foodImages) {
    const sim = cosineSimilarity(queryEmbedding, img.embedding)
    const e = scoreMap.get(img.food_id) ?? { total: 0, count: 0 }
    scoreMap.set(img.food_id, { total: e.total + sim, count: e.count + 1 })
  }

  let bestFood: Food | null = null
  let bestScore = -Infinity
  for (const food of foods) {
    const e = scoreMap.get(food.id)
    if (!e) continue
    const avg = e.total / e.count
    if (avg > bestScore) { bestScore = avg; bestFood = food }
  }

  return bestFood ? { food: bestFood, similarity: bestScore } : null
}

function cropCanvas(
  source: HTMLImageElement | HTMLCanvasElement,
  x: number, y: number, w: number, h: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(source, x, y, w, h, 0, 0, w, h)
  return canvas
}

export async function detectAndClassify(
  imageElement: HTMLImageElement,
  foods: Food[],
  foodImages: FoodImage[],
  options: { minConfidence?: number; minSimilarity?: number } = {}
): Promise<ClassificationResult[]> {
  const { minConfidence = 0.3, minSimilarity = 0.5 } = options

  const [mn, coco] = await Promise.all([loadMobileNet(), loadCocoSsd()])
  const predictions = await coco.detect(imageElement, 20, minConfidence)

  const { naturalWidth: W, naturalHeight: H } = imageElement
  const PAD = 0.05 // 5% padding around each crop

  const results: ClassificationResult[] = []
  const usedFoodIds = new Set<string>()

  // classify each detected bounding box
  for (const pred of predictions) {
    const [bx, by, bw, bh] = pred.bbox
    const px = Math.max(0, bx - bw * PAD)
    const py = Math.max(0, by - bh * PAD)
    const pw = Math.min(W - px, bw * (1 + 2 * PAD))
    const ph = Math.min(H - py, bh * (1 + 2 * PAD))

    const crop = cropCanvas(imageElement, px, py, pw, ph)
    const tensor = mn.infer(crop, true) as unknown as {
      data(): Promise<Float32Array>
      dispose(): void
    }
    const data = await tensor.data()
    tensor.dispose()

    const r = knnClassify(Array.from(data), foods, foodImages)
    if (!r || r.similarity < minSimilarity) continue
    if (usedFoodIds.has(r.food.id)) continue // deduplicate same food

    usedFoodIds.add(r.food.id)
    results.push(r)
  }

  // fallback: use full image if nothing detected
  if (results.length === 0) {
    const fullEmb = await extractEmbedding(imageElement)
    const r = knnClassify(fullEmb, foods, foodImages)
    if (r) results.push(r)
  }

  return results
}

// kept for food registration use
export { knnClassify as classify }
