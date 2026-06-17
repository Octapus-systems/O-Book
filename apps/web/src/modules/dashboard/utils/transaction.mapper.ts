import type { Transaction, TransactionStatus } from '../types/transaction.types'

export type ApiTransaction = {
  id: string
  type: 'CASH_IN' | 'CASH_OUT'
  amount: number
  signedAmount?: number
  balance?: number
  currency: string
  description: string | null
  date: string
  category: { id: string; name: string; type: string; color: string | null }
  paymentMethod: { id: string; name: string }
  createdBy: { id: string; name: string; email: string }
  cashbook: { id: string; name: string; baseCurrency: string }
  attachments?: Array<{
    id: string
    fileName: string
    filePath: string
    fileSize: number
    mimeType: string
    uploadedById?: string
    createdAt?: string | Date
  }>
}

const CATEGORY_STYLES: Array<'secondary' | 'tertiary' | 'primary'> = [
  'secondary',
  'tertiary',
  'primary',
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatDateParts(isoDate: string): { date: string; time: string } {
  const d = new Date(isoDate)
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
  }
}

export function mapApiTransactionToDisplay(tx: ApiTransaction, index = 0): Transaction {
  const signedAmount = tx.signedAmount ?? (tx.type === 'CASH_IN' ? tx.amount : -tx.amount)
  const { date, time } = formatDateParts(tx.date)
  const entityName = tx.description?.trim() || tx.createdBy.name

  return {
    id: tx.id,
    entity: entityName,
    date,
    time,
    category: tx.category.name,
    categoryStyle: CATEGORY_STYLES[index % CATEGORY_STYLES.length],
    amount: signedAmount,
    currency: tx.currency,
    status: 'approved' as TransactionStatus,
    book: tx.cashbook.name,
    balance: tx.balance ?? signedAmount,
    avatar: {
      initials: getInitials(entityName),
      color: 'bg-primary-fixed text-primary',
    },
    method: tx.paymentMethod.name,
    description: tx.description,
    attachments: tx.attachments?.map((att) => ({
      id: att.id,
      fileName: att.fileName,
      filePath: att.filePath,
      fileSize: att.fileSize,
      mimeType: att.mimeType,
      uploadedById: att.uploadedById,
      createdAt: att.createdAt
        ? (typeof att.createdAt === 'string' ? att.createdAt : att.createdAt.toISOString())
        : undefined,
    })),
  }
}

