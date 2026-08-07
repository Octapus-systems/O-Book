import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDatabaseErrorMessage } from '@/lib/database-error'

const DEFAULT_CASHBOOK_ID = 'default-cashbook'

export type ImportTransactionInput = {
  type: 'CASH_IN' | 'CASH_OUT'
  amount: number
  currency?: string
  categoryName: string
  paymentMethodName?: string
  description?: string
  date?: string
  createdByName?: string
  createdById?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transactions, cashbookId = DEFAULT_CASHBOOK_ID, fallbackUserId } = body

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No transaction data provided for import', error: 'EMPTY_PAYLOAD' },
        { status: 400 }
      )
    }

    // 1. Verify Cashbook existence
    let cashbook = await prisma.cashbook.findUnique({ where: { id: cashbookId } })
    if (!cashbook) {
      cashbook = await prisma.cashbook.findFirst()
      if (!cashbook) {
        return NextResponse.json(
          { success: false, message: 'Cashbook not found', error: 'CASHBOOK_NOT_FOUND' },
          { status: 404 }
        )
      }
    }

    // 2. Fetch existing PaymentMethods & Users & Categories
    const existingCategories = await prisma.category.findMany()
    const categoryMap = new Map<string, typeof existingCategories[0]>()
    existingCategories.forEach((cat) => {
      categoryMap.set(cat.name.trim().toLowerCase(), cat)
    })

    const existingPaymentMethods = await prisma.paymentMethod.findMany({ where: { isActive: true } })
    let defaultPaymentMethod = existingPaymentMethods[0]
    if (!defaultPaymentMethod) {
      defaultPaymentMethod = await prisma.paymentMethod.create({
        data: {
          name: 'Cash',
          description: 'Default payment method created on import',
          isActive: true,
        },
      })
    }

    const existingUsers = await prisma.user.findMany()
    const userMap = new Map<string, typeof existingUsers[0]>()
    existingUsers.forEach((usr) => {
      userMap.set(usr.name.trim().toLowerCase(), usr)
      userMap.set(usr.email.trim().toLowerCase(), usr)
    })

    const fallbackUser = fallbackUserId
      ? existingUsers.find((u) => u.id === fallbackUserId) || existingUsers[0]
      : existingUsers[0]

    if (!fallbackUser) {
      return NextResponse.json(
        { success: false, message: 'No registered user found in system', error: 'USER_NOT_FOUND' },
        { status: 400 }
      )
    }

    // 3. Process transactions in DB transaction
    let createdCategoryCount = 0
    const createdTransactions = []

    for (const item of transactions as ImportTransactionInput[]) {
      const type = item.type === 'CASH_IN' ? 'CASH_IN' : 'CASH_OUT'
      const amount = Math.abs(Number(item.amount) || 0)
      if (amount <= 0) continue

      const categoryNameRaw = item.categoryName?.trim() || 'General'
      const categoryKey = categoryNameRaw.toLowerCase()

      let category = categoryMap.get(categoryKey)
      if (!category) {
        // Create Category dynamically if it does not exist
        category = await prisma.category.create({
          data: {
            name: categoryNameRaw,
            type,
            isActive: true,
          },
        })
        categoryMap.set(categoryKey, category)
        createdCategoryCount++
      }

      // Match payment method
      let pmId = defaultPaymentMethod.id
      if (item.paymentMethodName) {
        const pmMatch = existingPaymentMethods.find(
          (pm) => pm.name.trim().toLowerCase() === item.paymentMethodName?.trim().toLowerCase()
        )
        if (pmMatch) pmId = pmMatch.id
      }

      // Match user
      let userId = fallbackUser.id
      if (item.createdById && existingUsers.some((u) => u.id === item.createdById)) {
        userId = item.createdById
      } else if (item.createdByName) {
        const userMatch = userMap.get(item.createdByName.trim().toLowerCase())
        if (userMatch) userId = userMatch.id
      }

      // Determine date
      let parsedDate = new Date()
      if (item.date) {
        const d = new Date(item.date)
        if (!isNaN(d.getTime())) {
          parsedDate = d
        }
      }

      const currency = (item.currency || cashbook.baseCurrency || 'INR').toUpperCase()
      const validCurrency = ['INR', 'AED', 'USD'].includes(currency) ? currency : 'INR'

      const createdTx = await prisma.transaction.create({
        data: {
          type,
          amount,
          currency: validCurrency,
          categoryId: category.id,
          paymentMethodId: pmId,
          cashbookId: cashbook.id,
          description: item.description?.trim() || null,
          date: parsedDate,
          createdById: userId,
        },
        include: {
          category: true,
          paymentMethod: true,
          createdBy: true,
        },
      })

      // Create Audit Log
      await prisma.auditLog.create({
        data: {
          transactionId: createdTx.id,
          userId,
          action: 'CREATED',
          changes: {
            imported: true,
            type,
            amount,
            currency: validCurrency,
            categoryId: category.id,
          },
        },
      })

      createdTransactions.push(createdTx)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${createdTransactions.length} transactions and created ${createdCategoryCount} new categories.`,
      data: {
        importedCount: createdTransactions.length,
        categoriesCreatedCount: createdCategoryCount,
      },
    })
  } catch (error) {
    console.error('Excel Import API error:', error)
    return NextResponse.json(
      { success: false, message: getDatabaseErrorMessage(error) || 'Import failed', error: 'IMPORT_FAILED' },
      { status: 500 }
    )
  }
}
