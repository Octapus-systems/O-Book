'use client'

import { X, ArrowLeft, Edit2, Trash2, Send, Clock, User, FileText, CreditCard } from 'lucide-react'
import type { Transaction } from '../types/transaction.types'
import { formatCurrencyAmount } from '../constants/currency'
import { useState } from 'react'

interface TransactionDetailPopupProps {
  transaction: Transaction | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (transaction: Transaction) => void
  onDelete?: (transaction: Transaction) => void
}

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

export function TransactionDetailPopup({
  transaction,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: TransactionDetailPopupProps) {
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

  if (!isOpen || !transaction) return null

  const isCashIn = transaction.amount >= 0

  const handleAddComment = () => {
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
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="glass-modal max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-[#0D0820]/95 p-6 shadow-2xl sm:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Transactions
          </button>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Transaction Details */}
        <div className="mb-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
                isCashIn 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {isCashIn ? 'Cash In' : 'Cash Out'}
              </div>
              <div className="mt-2 text-3xl font-bold text-white">
                {formatCurrencyAmount(transaction.amount, transaction.currency, { showSign: true })}
              </div>
            </div>
            <div className="flex gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(transaction)}
                  className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                  aria-label="Edit transaction"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(transaction)}
                  className="rounded-full p-2 text-white/70 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                  aria-label="Delete transaction"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                <Clock className="h-3 w-3" />
                Date
              </div>
              <div className="text-sm font-medium text-white">
                {transaction.date} • {transaction.time}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                <FileText className="h-3 w-3" />
                Category
              </div>
              <div className="text-sm font-medium text-white">
                {transaction.category}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                <User className="h-3 w-3" />
                Added By
              </div>
              <div className="text-sm font-medium text-white">
                Admin
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                <CreditCard className="h-3 w-3" />
                Payment Method
              </div>
              <div className="text-sm font-medium text-white">
                Cash
              </div>
            </div>
          </div>

        </div>

        {/* Comments Section */}
        <div className="mb-8 space-y-4">
          <h3 className="text-lg font-semibold text-white">
            Comments ({comments.length})
          </h3>

          {comments.length === 0 ? (
            <div className="rounded-2xl bg-white/5 p-4 text-center text-sm text-white/50">
              No comments yet. Be the first to add one.
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-2xl bg-white/5 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{comment.user}</span>
                    <span className="text-xs text-white/50">{comment.timestamp}</span>
                  </div>
                  <p className="text-sm text-white/80">{comment.text}</p>
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
              className="flex-1 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#6D4AFF]/50 transition-colors"
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
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">
            Audit Trail
          </h3>

          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 rounded-2xl bg-white/5 p-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6D4AFF]/20 text-[#6D4AFF]">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{log.user}</span>
                    <span className="text-xs text-white/50">{log.timestamp}</span>
                  </div>
                  <p className="text-sm text-white/70">{log.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
