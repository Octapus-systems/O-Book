'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { TransactionEntryForm } from '../components/TransactionEntryForm'
import { mapApiTransactionToDisplay, type ApiTransaction } from '../utils/transaction.mapper'
import { DEFAULT_CURRENCY, type SupportedCurrency } from '../constants/currency'
import type { TransactionType } from '../types/transaction.types'

export default function EditTransactionPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const transactionId = params.id as string
  const currencyParam = (searchParams.get('currency') as SupportedCurrency) || DEFAULT_CURRENCY

  const [transaction, setTransaction] = useState<ApiTransaction | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTransaction() {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/v1/transactions/${transactionId}`)
        const result = await response.json()
        if (!response.ok || !result.success) {
          setError(result.message || 'Failed to load transaction')
          return
        }
        setTransaction(result.data as ApiTransaction)
      } catch (err) {
        console.error('Fetch transaction error:', err)
        setError('Failed to load transaction')
      } finally {
        setIsLoading(false)
      }
    }

    if (transactionId) {
      fetchTransaction()
    }
  }, [transactionId])

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-body-md text-outline">Loading transaction...</div>
      </div>
    )
  }

  if (error || !transaction) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <div className="text-body-md text-red-700">{error || 'Transaction not found'}</div>
        <button
          onClick={() => router.push(`/transactions?currency=${currencyParam}`)}
          className="rounded-full bg-[#6D4AFF] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#8B6BFF] transition-colors"
        >
          Go Back
        </button>
      </div>
    )
  }

  const initialData = {
    type: transaction.type as TransactionType,
    currency: transaction.currency as SupportedCurrency,
    amount: String(transaction.amount),
    categoryId: transaction.category?.id || '',
    paymentMethodId: transaction.paymentMethod?.id || '',
    date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    description: transaction.description || undefined,
    createdById: transaction.createdBy?.id || '',
  }

  return (
    <div className="min-w-0 flex-1 space-y-6 fade-in">
      <div className="flex flex-col gap-4 border-b border-primary/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push(`/transactions/${transactionId}?currency=${currencyParam}`)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface-variant transition-colors hover:border-primary/30 hover:text-primary"
            aria-label="Back to transaction"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-headline text-headline-md font-bold text-on-surface">
              Edit Transaction
            </h1>
            <p className="text-body-md text-outline">Update transaction details</p>
          </div>
        </div>
      </div>

      <div className="glass-surface rim-light squircle w-full max-w-full overflow-hidden p-6 shadow-xl sm:p-8 lg:p-10">
        <TransactionEntryForm
          transactionId={transactionId}
          initialData={initialData}
        />
      </div>
    </div>
  )
}
