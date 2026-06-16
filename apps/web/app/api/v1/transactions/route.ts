import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { getDatabaseErrorMessage } from '@/lib/database-error'

const DEFAULT_CASHBOOK_ID = 'default-cashbook'
const MAX_FILE_SIZE = 10 * 1024 * 1024
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
  const uploadRoot = path.join(process.cwd(), 'public', 'uploads', 'transactions', transactionId)
  await mkdir(uploadRoot, { recursive: true })

  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      throw new Error(`Unsupported file type: ${file.type}`)
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File "${file.name}" exceeds 10 MB limit`)
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const diskPath = path.join(uploadRoot, safeName)
    const publicPath = `/uploads/transactions/${transactionId}/${safeName}`
    const bytes = await file.arrayBuffer()

    await writeFile(diskPath, Buffer.from(bytes))
    await prisma.transactionAttachment.create({
      data: {
        transactionId,
        fileName: file.name,
        filePath: publicPath,
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
        changes: { fileName: file.name },
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
    const { searchParams } = new URL(request.url)
    const cashbookId = searchParams.get('cashbookId') ?? DEFAULT_CASHBOOK_ID

    const transactions = await prisma.transaction.findMany({
      where: { cashbookId },
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
    const withBalance = transactions.map((tx) => {
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
        category: tx.category,
        paymentMethod: tx.paymentMethod,
        createdBy: tx.createdBy,
        cashbook: tx.cashbook,
        attachments: tx.attachments,
      }
    })

    return NextResponse.json(
      { success: true, data: withBalance.reverse() },
      { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } }
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

    if (!categoryId || !paymentMethodId || !createdById) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields', error: 'MISSING_FIELDS' },
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
          createdById,
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
          userId: createdById,
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
