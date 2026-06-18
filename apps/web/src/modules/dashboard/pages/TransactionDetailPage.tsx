'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { ArrowLeft, Edit2, Trash2, Send, Clock, FileText, User, CreditCard, ExternalLink } from 'lucide-react'
import type { Transaction } from '../types/transaction.types'
import { mapApiTransactionToDisplay, type ApiTransaction } from '../utils/transaction.mapper'
import { formatCurrencyAmount, DEFAULT_CURRENCY, type SupportedCurrency } from '../constants/currency'

interface Comment {
  id: string
  user: string
  text: string
  timestamp: string
}

interface AuditLog {
  id: string
  user: string
  action: string
  timestamp: string
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}


export default function TransactionDetailPage({
  initialApiTransaction,
}: {
  initialApiTransaction?: ApiTransaction
}) {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const transactionId = params.id as string
  const currencyParam = (searchParams.get('currency') as SupportedCurrency) || DEFAULT_CURRENCY

  const [transaction, setTransaction] = useState<Transaction | null>(() =>
    initialApiTransaction ? mapApiTransactionToDisplay(initialApiTransaction, 0) : null
  )
  const [isLoading, setIsLoading] = useState(!initialApiTransaction)
  const [error, setError] = useState<string | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')

  const auditLogs: AuditLog[] = [
    {
      id: '1',
      user: 'Admin',
      action: 'Created transaction',
      timestamp: transaction?.date || '',
    },
  ]

  useEffect(() => {
    async function fetchTransaction() {
      if (!initialApiTransaction) {
        setIsLoading(true)
      }
      setError(null)
      try {
        const response = await fetch(`/api/v1/transactions/${transactionId}`)
        const result = await response.json()
        if (!response.ok || !result.success) {
          if (!initialApiTransaction) {
            setError(result.message || 'Failed to load transaction')
          }
          return
        }
        const mapped = mapApiTransactionToDisplay(result.data as ApiTransaction, 0)
        setTransaction(mapped)
      } catch (err) {
        console.error('Fetch transaction error:', err)
        if (!initialApiTransaction) {
          setError('Failed to load transaction')
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (transactionId) {
      fetchTransaction()
    }
  }, [transactionId, initialApiTransaction])

  const handleAddComment = useCallback(() => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: Date.now().toString(),
        user: 'Admin',
        text: newComment,
        timestamp: new Date().toISOString(),
      }
      setComments([...comments, comment])
      setNewComment('')
    }
  }, [newComment, comments])

  const handleEdit = useCallback(() => {
    if (transaction) {
      router.push(`/transactions/${transaction.id}/edit`)
    }
  }, [transaction, router])

  const handleDelete = useCallback(async () => {
    if (!transaction) return

    if (confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/v1/transactions/${transaction.id}`, {
          method: 'DELETE',
        })
        const result = await response.json()

        if (!response.ok || !result.success) {
          alert(result.message || 'Failed to delete transaction')
          return
        }

        router.push(`/transactions?currency=${currencyParam}&refresh=${Date.now()}`)
      } catch (err) {
        console.error('Delete transaction error:', err)
        alert('Failed to delete transaction')
      }
    }
  }, [transaction, router])

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-body-md text-outline">Loading transaction details...</div>
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

  const isCashIn = transaction.amount >= 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(`/transactions?currency=${currencyParam}`)}
          className="flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Transactions
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleEdit}
            className="rounded-full p-2 text-on-surface-variant hover:bg-on-surface/10 hover:text-on-surface transition-colors"
            aria-label="Edit transaction"
          >
            <Edit2 className="h-5 w-5" />
          </button>
          <button
            onClick={handleDelete}
            className="rounded-full p-2 text-on-surface-variant hover:bg-red-500/20 hover:text-red-600 transition-colors"
            aria-label="Delete transaction"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Transaction Details Card */}
      <div className="glass-surface rim-light squircle p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
              isCashIn 
                ? 'bg-green-500/20 text-green-600 border border-green-500/30' 
                : 'bg-red-500/20 text-red-600 border border-red-500/30'
            }`}>
              {isCashIn ? 'Cash In' : 'Cash Out'}
            </div>
            <div className="mt-2 text-3xl font-bold text-on-surface">
              {formatCurrencyAmount(transaction.amount, transaction.currency, { showSign: true })}
            </div>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              <Clock className="h-3 w-3" />
              Date
            </div>
            <div className="text-sm font-medium text-on-surface">
              {transaction.date} • {transaction.time}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              <FileText className="h-3 w-3" />
              Category
            </div>
            <div className="text-sm font-medium text-on-surface">
              {transaction.category}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              <User className="h-3 w-3" />
              Added By
            </div>
            <div className="text-sm font-medium text-on-surface">
              {transaction.createdBy?.name || 'Unknown'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              <CreditCard className="h-3 w-3" />
              Payment Method
            </div>
            <div className="text-sm font-medium text-on-surface">
              {transaction.method || 'Cash'}
            </div>
          </div>

          {transaction.description && (
            <div className="sm:col-span-2 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                <FileText className="h-3 w-3" />
                Description
              </div>
              <div className="text-sm font-medium text-on-surface break-words">
                {transaction.description}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attachments Section */}
      {transaction.attachments && transaction.attachments.length > 0 && (
        <div className="glass-surface rim-light squircle p-6 sm:p-8">
          <h3 className="mb-4 text-lg font-semibold text-on-surface">
            Attachments ({transaction.attachments.length})
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {transaction.attachments.map((file) => {
              const isImage = file.mimeType?.startsWith('image/')
              return (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-2xl bg-on-surface/5 border border-on-surface/10 p-4 hover:bg-on-surface/10 transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-on-surface/5 text-on-surface-variant overflow-hidden">
                      {isImage ? (
                        <img
                          src={file.filePath}
                          alt={file.fileName}
                          className="h-10 w-10 rounded-xl object-cover"
                        />
                      ) : (
                        <FileText className="h-5 w-5" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="truncate text-sm font-medium text-on-surface" title={file.fileName}>
                        {file.fileName}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {formatFileSize(file.fileSize)}
                      </p>
                    </div>
                  </div>
                  <a
                    href={file.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full p-2 text-on-surface-variant hover:bg-on-surface/10 hover:text-on-surface transition-colors"
                    title="Open attachment"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      )}


      {/* Comments Section */}
      <div className="glass-surface rim-light squircle p-6 sm:p-8">
        <h3 className="mb-4 text-lg font-semibold text-on-surface">
          Comments ({comments.length})
        </h3>

        {comments.length === 0 ? (
          <div className="rounded-2xl bg-on-surface/5 p-4 text-center text-sm text-on-surface-variant">
            No comments yet. Be the first to add one.
          </div>
        ) : (
          <div className="mb-4 space-y-3">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-2xl bg-on-surface/5 p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-on-surface">{comment.user}</span>
                  <span className="text-xs text-on-surface-variant">{comment.timestamp}</span>
                </div>
                <p className="text-sm text-on-surface">{comment.text}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            className="flex-1 rounded-2xl bg-on-surface/5 border border-on-surface/10 px-4 py-3 text-sm text-on-surface placeholder:text-on-surface/40 outline-none focus:border-[#6D4AFF]/50 transition-colors"
          />
          <button
            onClick={handleAddComment}
            className="rounded-full bg-[#6D4AFF] p-3 text-white hover:bg-[#8B6BFF] transition-colors"
            aria-label="Send comment"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Audit Trail Section */}
      <div className="glass-surface rim-light squircle p-6 sm:p-8">
        <h3 className="mb-4 text-lg font-semibold text-on-surface">
          Audit Trail
        </h3>

        <div className="space-y-3">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 rounded-2xl bg-on-surface/5 p-4"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6D4AFF]/20 text-[#6D4AFF]">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-on-surface">{log.user}</span>
                  <span className="text-xs text-on-surface-variant">{log.timestamp}</span>
                </div>
                <p className="text-sm text-on-surface/70">{log.action}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
