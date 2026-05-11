import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { BottomNav } from '@/components/BottomNav'
import { Toaster } from '@/components/ui/sonner'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PFCカロリー記録',
  description: '食事写真からPFC・カロリーを記録するアプリ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className={`${geist.className} min-h-full flex flex-col bg-background text-foreground`}>
        <main className="flex-1 pb-16">{children}</main>
        <BottomNav />
        <Toaster />
      </body>
    </html>
  )
}
