import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDatabaseErrorMessage } from '@/lib/database-error'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id
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
      return NextResponse.json(
        { success: false, message: 'Transaction not found', error: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    const amount = Number(transaction.amount)
    const signedAmount = transaction.type === 'CASH_IN' ? amount : -amount

    const apiTransaction = {
      ...transaction,
      amount,
      signedAmount,
      balance: signedAmount,
    }

    return NextResponse.json(
      { success: true, data: apiTransaction },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    )
  } catch (error) {
    console.error('Fetch transaction error:', error)
    return NextResponse.json(
      { success: false, message: getDatabaseErrorMessage(error), error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id
    const body = await request.json()

    const { type, amount, categoryId, paymentMethodId, currency, description, date, createdById } = body

    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
    })

    if (!existingTransaction) {
      return NextResponse.json(
        { success: false, message: 'Transaction not found', error: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (type !== undefined) updateData.type = type
    if (amount !== undefined) updateData.amount = amount
    if (categoryId !== undefined) updateData.categoryId = categoryId
    if (paymentMethodId !== undefined) updateData.paymentMethodId = paymentMethodId
    if (currency !== undefined) updateData.currency = currency
    if (description !== undefined) updateData.description = description
    if (date !== undefined) updateData.date = new Date(date)
    if (createdById !== undefined) updateData.createdById = createdById

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        paymentMethod: true,
        createdBy: true,
        cashbook: true,
        attachments: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Transaction updated successfully',
      data: updatedTransaction,
    })
  } catch (error) {
    console.error('Update transaction error:', error)
    return NextResponse.json(
      { success: false, message: getDatabaseErrorMessage(error), error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id

    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
    })

    if (!existingTransaction) {
      return NextResponse.json(
        { success: false, message: 'Transaction not found', error: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    await prisma.transaction.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Transaction deleted successfully',
    })
  } catch (error) {
    console.error('Delete transaction error:', error)
    return NextResponse.json(
      { success: false, message: getDatabaseErrorMessage(error), error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
