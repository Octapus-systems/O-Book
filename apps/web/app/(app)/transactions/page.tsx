import TransactionsPage from '@/modules/dashboard/pages/TransactionsPage'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Page() {
  const transactions = await prisma.transaction.findMany({
    where: { cashbookId: 'default-cashbook' },
    include: {
      category: true,
      paymentMethod: true,
      createdBy: true,
      cashbook: true,
      attachments: true,
    },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
  })

  let runningBalance = 0
  const serializedTransactions = transactions.map((tx) => {
    const amount = Number(tx.amount)
    const signedAmount = tx.type === 'CASH_IN' ? amount : -amount
    runningBalance += signedAmount
    return {
      id: tx.id,
      type: tx.type,
      amount,
      signedAmount,
      balance: runningBalance,
      currency: tx.currency,
      description: tx.description,
      date: tx.date.toISOString(),
      category: {
        id: tx.category.id,
        name: tx.category.name,
        type: tx.category.type,
        color: tx.category.color,
      },
      paymentMethod: {
        id: tx.paymentMethod.id,
        name: tx.paymentMethod.name,
      },
      createdBy: {
        id: tx.createdBy.id,
        name: tx.createdBy.name,
        email: tx.createdBy.email,
      },
      cashbook: {
        id: tx.cashbook.id,
        name: tx.cashbook.name,
        baseCurrency: tx.cashbook.baseCurrency,
      },
      attachments: tx.attachments.map((att: { id: string; fileName: string; filePath: string; fileSize: number; mimeType: string }) => ({
        id: att.id,
        fileName: att.fileName,
        filePath: att.filePath,
        fileSize: att.fileSize,
        mimeType: att.mimeType,
      })),
    }
  })

  return <TransactionsPage initialApiTransactions={serializedTransactions.reverse()} />
}
