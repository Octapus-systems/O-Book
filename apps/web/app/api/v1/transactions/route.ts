import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDatabaseErrorMessage } from '@/lib/database-error'
import { uploadAttachment } from '@/lib/supabase-storage'

import { authenticateApiKeyOrSession } from '@/lib/api-auth'

const DEFAULT_CASHBOOK_ID = 'default-cashbook'
const MAX_FILE_SIZE = 50 * 1024 * 1024  // 50 MB — matches Supabase bucket limit
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
])

async function saveAttachments(
  transactionId: string,
  files: File[],
  uploadedById: string
) {
  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      throw new Error(`Unsupported file type: ${file.type}`)
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File "${file.name}" exceeds 50 MB limit`)
    }

    // Upload to Supabase Storage — returns public URL
    const publicUrl = await uploadAttachment(transactionId, file)

    await prisma.transactionAttachment.create({
      data: {
        transactionId,
        fileName: file.name,
        filePath: publicUrl,
        fileSize: file.size,
        mimeType: file.type,
        uploadedById,
      },
    })

    await prisma.auditLog.create({
      data: {
        transactionId,
        userId: uploadedById,
        action: 'ATTACHMENT_ADDED',
        changes: { fileName: file.name, url: publicUrl },
      },
    })
  }
}

function parseTransactionPayload(formData: FormData) {
  const type = String(formData.get('type') ?? '')
  const amount = Number(formData.get('amount'))
  const categoryId = String(formData.get('categoryId') ?? '')
  const paymentMethodId = String(formData.get('paymentMethodId') ?? '')
  const cashbookId = String(formData.get('cashbookId') ?? DEFAULT_CASHBOOK_ID)
  const currency = String(formData.get('currency') ?? 'AED')
  const description = formData.get('description')
  const date = formData.get('date')
  const createdById = String(formData.get('createdById') ?? '')
  const files = formData.getAll('files').filter((item): item is File => item instanceof File && item.size > 0)

  return {
    type,
    amount,
    categoryId,
    paymentMethodId,
    cashbookId,
    currency,
    description: description ? String(description) : undefined,
    date: date ? String(date) : undefined,
    createdById,
    files,
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApiKeyOrSession(request, 'transactions:read')
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { success: false, message: auth.error ?? 'Unauthorized' },
        { status: auth.status ?? 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const cashbookId = searchParams.get('cashbookId') ?? DEFAULT_CASHBOOK_ID
    const currencyParam = searchParams.get('currency')

    const transactions = await prisma.transaction.findMany({
      where: {
        cashbookId,
        ...(currencyParam ? { currency: currencyParam } : {}),
      },
      include: {
        category: true,
        paymentMethod: true,
        createdBy: true,
        cashbook: true,
        attachments: true,
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    })

    const runningBalances: Record<string, number> = {}
    const withBalance = transactions.map((tx) => {
      const amount = Number(tx.amount)
      const signedAmount = tx.type === 'CASH_IN' ? amount : -amount
      const curr = tx.currency || 'AED'
      runningBalances[curr] = (runningBalances[curr] || 0) + signedAmount
      return {
        id: tx.id,
        type: tx.type,
        amount,
        signedAmount,
        balance: runningBalances[curr],
        currency: tx.currency,
        description: tx.description,
        date: tx.date.toISOString(),
        createdAt: tx.createdAt.toISOString(),
        category: tx.category,
        paymentMethod: tx.paymentMethod,
        createdBy: tx.createdBy,
        cashbook: tx.cashbook,
        attachments: tx.attachments,
      }
    })

    return NextResponse.json(
      { success: true, data: withBalance.reverse() },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    )
  } catch (error) {
    console.error('Fetch transactions error:', error)
    return NextResponse.json(
      { success: false, message: getDatabaseErrorMessage(error), error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApiKeyOrSession(request, 'transactions:write')
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { success: false, message: auth.error ?? 'Unauthorized' },
        { status: auth.status ?? 401 }
      )
    }

    const contentType = request.headers.get('content-type') ?? ''
    let payload

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      payload = parseTransactionPayload(formData)
    } else {
      const body = await request.json()
      payload = {
        ...body,
        files: [] as File[],
      }
    }

    const {
      type,
      amount,
      categoryId,
      paymentMethodId,
      cashbookId = DEFAULT_CASHBOOK_ID,
      currency,
      description,
      date,
      createdById,
      files,
    } = payload

    const effectiveCreatedById = createdById || auth.user?.id

    if (!type || !['CASH_IN', 'CASH_OUT'].includes(type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid transaction type', error: 'INVALID_TYPE' },
        { status: 400 }
      )
    }

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json(
        { success: false, message: 'Amount must be greater than zero', error: 'INVALID_AMOUNT' },
        { status: 400 }
      )
    }

    if (!currency || !['AED', 'INR'].includes(currency)) {
      return NextResponse.json(
        { success: false, message: 'Currency must be AED or INR', error: 'INVALID_CURRENCY' },
        { status: 400 }
      )
    }

    if (!categoryId || !paymentMethodId || !effectiveCreatedById) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields (categoryId, paymentMethodId)', error: 'MISSING_FIELDS' },
        { status: 400 }
      )
    }

    const [cashbook, category] = await Promise.all([
      prisma.cashbook.findUnique({ where: { id: cashbookId } }),
      prisma.category.findUnique({ where: { id: categoryId } }),
    ])

    if (!cashbook) {
      return NextResponse.json(
        { success: false, message: 'Cashbook not found', error: 'CASHBOOK_NOT_FOUND' },
        { status: 404 }
      )
    }

    if (!category || category.type !== type) {
      return NextResponse.json(
        { success: false, message: 'Invalid category for transaction type', error: 'INVALID_CATEGORY' },
        { status: 400 }
      )
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          type,
          amount,
          currency,
          categoryId,
          paymentMethodId,
          cashbookId,
          description: description ?? null,
          date: date ? new Date(date) : new Date(),
          createdById: effectiveCreatedById,
        },
        include: {
          category: true,
          paymentMethod: true,
          createdBy: true,
          cashbook: true,
        },
      })

      await tx.auditLog.create({
        data: {
          transactionId: created.id,
          userId: effectiveCreatedById,
          action: 'CREATED',
          changes: {
            type,
            amount: Number(amount),
            currency,
            categoryId,
            paymentMethodId,
          },
        },
      })

      return created
    })

    if (files.length > 0) {
      await saveAttachments(transaction.id, files, createdById)
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction created',
      data: { transaction },
    })
  } catch (error) {
    console.error('Create transaction error:', error)
    const message =
      error instanceof Error ? error.message : 'Failed to create transaction'
    return NextResponse.json(
      { success: false, message: getDatabaseErrorMessage(error) || message, error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
