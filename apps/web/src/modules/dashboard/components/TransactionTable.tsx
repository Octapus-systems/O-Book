'use client'

import { useMemo, useState, useEffect } from 'react'
import { MoreVertical } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Transaction, TransactionStatus } from '../types/transaction.types'
import { formatCurrencyAmount } from '../constants/currency'
import { cn } from '@/lib/utils'

type TransactionTableProps = {
  transactions: Transaction[]
  selectedId: string | null
  onSelect: (id: string) => void
  onRowClick?: (transaction: Transaction) => void
}

const STATUS_STYLES: Record<
  TransactionStatus,
  { bg: string; text: string; border: string; glow: string; dot: string; label: string }
> = {
  approved: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
    glow: 'badge-glow-success',
    dot: 'bg-green-500',
    label: 'Approved',
  },
  pending: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    glow: 'badge-glow-warning',
    dot: 'bg-yellow-500',
    label: 'Pending',
  },
  flagged: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    glow: 'badge-glow-error',
    dot: 'bg-red-500',
    label: 'Flagged',
  },
}

const CATEGORY_STYLES = {
  secondary: 'bg-secondary-container/20 text-on-secondary-fixed-variant border-secondary-container/30',
  tertiary: 'bg-tertiary-container/20 text-on-tertiary-fixed-variant border-tertiary-container/30',
  primary: 'bg-primary-fixed/50 text-on-primary-fixed-variant border-primary/20',
}

function formatAmount(amount: number, currency: string) {
  return formatCurrencyAmount(amount, currency, { showSign: true })
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function TransactionTable({ transactions, selectedId, onSelect, onRowClick }: TransactionTableProps) {
  const router = useRouter()
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null)

  useEffect(() => {
    const handleClose = () => setActiveDropdownId(null)
    window.addEventListener('click', handleClose)
    return () => window.removeEventListener('click', handleClose)
  }, [])

  const handleDelete = async (txId: string, currency: string) => {
    if (confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/v1/transactions/${txId}`, {
          method: 'DELETE',
        })
        const result = await response.json()
        if (!response.ok || !result.success) {
          alert(result.message || 'Failed to delete transaction')
          return
        }
        router.push(`/transactions?currency=${currency}&refresh=${Date.now()}`)
      } catch (err) {
        console.error('Delete error:', err)
        alert('Failed to delete transaction')
      }
    }
  }

  return (
    <div className="glass-surface rim-light squircle overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse text-left sm:min-w-0">
          <thead className="border-b border-primary/10 bg-primary-fixed/20">
            <tr>
              {['Description & User', 'Category', 'Amount', 'Balance', 'Action'].map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-label-sm font-bold uppercase tracking-wider text-outline sm:px-6 sm:py-4"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {transactions.map((tx: Transaction) => {
              const isSelected = tx.id === selectedId
              const creatorName = tx.createdBy?.name || 'Unknown'
              const creatorInitials = getInitials(creatorName)

              return (
                <tr
                  key={tx.id}
                  onClick={() => {
                    onSelect(tx.id)
                    onRowClick?.(tx)
                  }}
                  className={cn(
                    'cursor-pointer transition-colors hover:bg-primary-fixed/10',
                    isSelected && 'border-l-4 border-primary bg-primary-fixed/5'
                  )}
                >
                  <td className="px-4 py-4 sm:px-6 sm:py-5">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/20 text-xs font-bold sm:h-10 sm:w-10 sm:text-sm bg-primary-fixed text-primary'
                        )}
                      >
                        {creatorInitials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-body text-body-md font-bold text-on-surface truncate sm:text-body-lg">
                          {tx.description || '-'}
                        </p>
                        <p className="text-label-sm text-outline sm:text-label-sm">
                          Added by {creatorName} • {tx.date} • {tx.time}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 sm:px-6 sm:py-5">
                    <span
                      className={cn(
                        'inline-block rounded-full border px-2 py-0.5 text-label-xs font-bold sm:px-3 sm:py-1 sm:text-label-sm',
                        CATEGORY_STYLES[tx.categoryStyle as keyof typeof CATEGORY_STYLES]
                      )}
                    >
                      {tx.category}
                    </span>
                  </td>
                  <td className="px-4 py-4 sm:px-6 sm:py-5">
                    <div className="flex flex-col">
                      <span
                        className={cn(
                          'font-title text-body-md font-bold sm:text-title-md',
                          tx.amount >= 0 ? 'text-green-700' : 'text-red-700'
                        )}
                      >
                        {formatAmount(tx.amount, tx.currency)}
                      </span>
                      <span className="text-label-xs text-outline sm:text-label-sm">{tx.currency}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 sm:px-6 sm:py-5">
                    <span className="font-title text-body-md font-bold text-on-surface sm:text-title-md">
                      {formatAmount(tx.balance, tx.currency)}
                    </span>
                  </td>
                  <td className="px-4 py-4 sm:px-6 sm:py-5 relative">
                    <button
                      type="button"
                      className="text-outline transition-colors hover:text-primary p-2 rounded-full hover:bg-primary-fixed/10"
                      aria-label="Actions"
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveDropdownId(activeDropdownId === tx.id ? null : tx.id)
                      }}
                    >
                      <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    {activeDropdownId === tx.id && (
                      <div className="absolute right-4 mt-1 z-50 w-32 rounded-2xl border border-outline-variant bg-surface-container-lowest py-2 shadow-xl">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/transactions/${tx.id}/edit?currency=${tx.currency}`)
                            setActiveDropdownId(null)
                          }}
                          className="flex w-full items-center px-4 py-2 font-body text-body-md text-on-surface hover:bg-primary-fixed/20 text-left transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(tx.id, tx.currency)
                            setActiveDropdownId(null)
                          }}
                          className="flex w-full items-center px-4 py-2 font-body text-body-md text-red-600 hover:bg-red-500/10 text-left transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
