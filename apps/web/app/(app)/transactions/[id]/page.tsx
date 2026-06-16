import TransactionDetailPage from '@/modules/dashboard/pages/TransactionDetailPage'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
  
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      category: true,
      paymentMethod: true,
      createdBy: true,
      cashbook: true,
      attachments: true,
    },
  })

  if (!transaction) {
    notFound()
  }

  const amount = Number(transaction.amount)
  const signedAmount = transaction.type === 'CASH_IN' ? amount : -amount

  const apiTransaction = {
    id: transaction.id,
    type: transaction.type,
    amount,
    signedAmount,
    balance: signedAmount,
    currency: transaction.currency,
    description: transaction.description,
    date: transaction.date.toISOString(),
    category: {
      id: transaction.category.id,
      name: transaction.category.name,
      type: transaction.category.type,
      color: transaction.category.color,
    },
    paymentMethod: {
      id: transaction.paymentMethod.id,
      name: transaction.paymentMethod.name,
    },
    createdBy: {
      id: transaction.createdBy.id,
      name: transaction.createdBy.name,
      email: transaction.createdBy.email,
    },
    cashbook: {
      id: transaction.cashbook.id,
      name: transaction.cashbook.name,
      baseCurrency: transaction.cashbook.baseCurrency,
    },
    attachments: transaction.attachments.map((att) => ({
      id: att.id,
      fileName: att.fileName,
      filePath: att.filePath,
      fileSize: att.fileSize,
      mimeType: att.mimeType,
    })),
  }

  return <TransactionDetailPage initialApiTransaction={apiTransaction} />
}
