'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { TransactionEntryForm } from '../components/TransactionEntryForm'
import { DEFAULT_CURRENCY, type SupportedCurrency } from '../constants/currency'
import type { TransactionType } from '../types/transaction.types'

function parseInitialType(typeParam: string | null): TransactionType {
  if (typeParam === 'CASH_OUT') return 'CASH_OUT'
  return 'CASH_IN'
}

export default function NewTransactionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialType = parseInitialType(searchParams.get('type'))
  const currencyParam = (searchParams.get('currency') as SupportedCurrency) || DEFAULT_CURRENCY

  return (
    <div className="min-w-0 flex-1 space-y-6 fade-in">
      <div className="flex flex-col gap-4 border-b border-primary/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push(`/transactions?currency=${currencyParam}`)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface-variant transition-colors hover:border-primary/30 hover:text-primary"
            aria-label="Back to transactions"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-headline text-headline-md font-bold text-on-surface">
              New Transaction
            </h1>
            <p className="text-body-md text-outline">Record a cash in or cash out entry</p>
          </div>
        </div>
      </div>

      <div className="glass-surface rim-light squircle w-full p-6 shadow-xl sm:p-8 lg:p-10">
        <TransactionEntryForm initialType={initialType} />
      </div>
    </div>
  )
}
