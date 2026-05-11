'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Camera, UtensilsCrossed, History, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'ホーム', icon: Home },
  { href: '/log', label: '記録', icon: Camera },
  { href: '/foods', label: '食べ物', icon: UtensilsCrossed },
  { href: '/history', label: '履歴', icon: History },
  { href: '/goals', label: '目標', icon: Target },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
