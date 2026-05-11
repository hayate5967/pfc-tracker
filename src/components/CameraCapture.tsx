'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Camera, RotateCcw, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  onCapture: (dataUrl: string, imageElement: HTMLImageElement) => void
  label?: string
}

export function CameraCapture({ onCapture, label = '撮影する' }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [streaming, setStreaming] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    })
    streamRef.current = stream
    setStreaming(true)
    setPreview(null)
  }, [])

  // video要素がDOMに追加された後にstreamをセット
  useEffect(() => {
    if (streaming && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play()
    }
  }, [streaming])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setStreaming(false)
  }, [])

  const capture = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')!.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setPreview(dataUrl)
    stopCamera()

    const img = new Image()
    img.onload = () => onCapture(dataUrl, img)
    img.src = dataUrl
  }, [onCapture, stopCamera])

  const reset = useCallback(() => {
    setPreview(null)
    setStreaming(false)
  }, [])

  if (preview) {
    return (
      <div className="space-y-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="撮影した写真" className="w-full rounded-lg object-cover max-h-64" />
        <Button variant="outline" size="sm" onClick={reset} className="w-full">
          <RotateCcw className="h-4 w-4 mr-2" />
          撮り直す
        </Button>
      </div>
    )
  }

  if (streaming) {
    return (
      <div className="space-y-2">
        <video ref={videoRef} className="w-full rounded-lg object-cover max-h-64" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />
        <div className="flex gap-2">
          <Button onClick={capture} className="flex-1">
            <Check className="h-4 w-4 mr-2" />
            シャッター
          </Button>
          <Button variant="outline" onClick={stopCamera}>
            キャンセル
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      <Button variant="outline" onClick={startCamera} className="w-full">
        <Camera className="h-4 w-4 mr-2" />
        {label}
      </Button>
    </>
  )
}
