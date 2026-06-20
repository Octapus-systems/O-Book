'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'

export function FloatingActionButton() {
  const router = useRouter()
  const pathname = usePathname()
  const [currentCurrency, setCurrentCurrency] = useState('AED')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const cur = params.get('currency')
      if (cur) {
        setCurrentCurrency(cur)
      }
    }
  }, [pathname])

  return (
    <button
      type="button"
      onClick={() => router.push(`/transactions/new?currency=${currentCurrency}`)}
      className="group fixed bottom-10 right-10 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-2xl transition-all hover:scale-110 active:scale-95"
      aria-label="Quick Add Transaction"
    >
      <Plus className="h-8 w-8" />
      <span className="pointer-events-none absolute right-full mr-4 whitespace-nowrap rounded-lg bg-inverse-surface px-4 py-2 text-label-sm font-bold text-inverse-onSurface opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        Quick Add Transaction
      </span>
    </button>
  )
}
