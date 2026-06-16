'use client'

import { cn } from '@/lib/utils'
import type { TransactionType } from '../types/transaction.types'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'

type TransactionTypeToggleProps = {
  value: TransactionType
  onChange: (type: TransactionType) => void
}

export function TransactionTypeToggle({ value, onChange }: TransactionTypeToggleProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => onChange('CASH_IN')}
        className={cn(
          'flex min-h-[52px] items-center justify-center gap-2 rounded-full border px-4 py-3 font-title text-title-md font-semibold transition-all duration-200',
          value === 'CASH_IN'
            ? 'border-green-300 bg-green-100 text-green-700 shadow-sm badge-glow-success'
            : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-green-200 hover:bg-green-50'
        )}
      >
        <ArrowDownLeft className="h-5 w-5" />
        Cash In
      </button>
      <button
        type="button"
        onClick={() => onChange('CASH_OUT')}
        className={cn(
          'flex min-h-[52px] items-center justify-center gap-2 rounded-full border px-4 py-3 font-title text-title-md font-semibold transition-all duration-200',
          value === 'CASH_OUT'
            ? 'border-red-300 bg-red-100 text-red-700 shadow-sm badge-glow-error'
            : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-red-200 hover:bg-red-50'
        )}
      >
        <ArrowUpRight className="h-5 w-5" />
        Cash Out
      </button>
    </div>
  )
}
