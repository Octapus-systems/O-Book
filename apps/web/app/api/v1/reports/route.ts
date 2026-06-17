import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDatabaseErrorMessage } from '@/lib/database-error'

const DEFAULT_CASHBOOK_ID = 'default-cashbook'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cashbookId = searchParams.get('cashbookId') ?? DEFAULT_CASHBOOK_ID
    const currency = searchParams.get('currency') ?? 'AED'
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    const startDate = startDateParam ? new Date(startDateParam) : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const endDate = endDateParam ? new Date(endDateParam) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999)

    // Fetch all matching transactions in date range
    const transactions = await prisma.transaction.findMany({
      where: {
        cashbookId,
        currency,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    })

    // Compute summary stats
    let totalCashIn = 0
    let totalCashOut = 0

    for (const tx of transactions) {
      const amt = Number(tx.amount)
      if (tx.type === 'CASH_IN') {
        totalCashIn += amt
      } else {
        totalCashOut += amt
      }
    }

    const netBalance = totalCashIn - totalCashOut

    // Build daily series
    // Group by date string (YYYY-MM-DD)
    const dayMap = new Map<string, { cashIn: number; cashOut: number }>()

    for (const tx of transactions) {
      const dateKey = tx.date.toISOString().split('T')[0]
      const entry = dayMap.get(dateKey) ?? { cashIn: 0, cashOut: 0 }
      const amt = Number(tx.amount)
      if (tx.type === 'CASH_IN') {
        entry.cashIn += amt
      } else {
        entry.cashOut += amt
      }
      dayMap.set(dateKey, entry)
    }

    // Fill every calendar day in range (for smooth charts)
    const dailySeries: Array<{
      date: string
      cashIn: number
      cashOut: number
      net: number
      balance: number
    }> = []

    let runningBalance = 0
    const cursor = new Date(startDate)
    cursor.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    while (cursor <= end) {
      const key = cursor.toISOString().split('T')[0]
      const day = dayMap.get(key) ?? { cashIn: 0, cashOut: 0 }
      runningBalance += day.cashIn - day.cashOut
      dailySeries.push({
        date: key,
        cashIn: day.cashIn,
        cashOut: day.cashOut,
        net: day.cashIn - day.cashOut,
        balance: runningBalance,
      })
      cursor.setDate(cursor.getDate() + 1)
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalCashIn,
          totalCashOut,
          netBalance,
          transactionCount: transactions.length,
          currency,
        },
        dailySeries,
      },
    })
  } catch (error) {
    console.error('Reports API error:', error)
    return NextResponse.json(
      { success: false, message: getDatabaseErrorMessage(error), error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
