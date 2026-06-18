import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDatabaseErrorMessage } from '@/lib/database-error'

type Params = { params: Promise<{ id: string }> }

// PATCH /api/v1/categories/[id] — update category details
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, type, description, color, isActive } = body

    const existing = await prisma.category.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 })
    }

    if (type && type !== 'CASH_IN' && type !== 'CASH_OUT') {
      return NextResponse.json(
        { success: false, message: 'type must be CASH_IN or CASH_OUT' },
        { status: 400 }
      )
    }

    const trimmedName = name?.trim()

    // Check name uniqueness if it is changing
    if (trimmedName && trimmedName !== existing.name) {
      const nameTaken = await prisma.category.findUnique({ where: { name: trimmedName } })
      if (nameTaken) {
        return NextResponse.json({ success: false, message: 'Category name already exists' }, { status: 409 })
      }
    }

    const updateData: Record<string, any> = {}
    if (trimmedName) updateData.name = trimmedName
    if (type) updateData.type = type
    if (description !== undefined) updateData.description = description?.trim() || null
    if (color !== undefined) updateData.color = color?.trim() || null
    if (isActive !== undefined) updateData.isActive = isActive

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, message: 'Category updated', data: category })
  } catch (error) {
    console.error('PATCH /categories/[id] error:', error)
    return NextResponse.json(
      { success: false, message: getDatabaseErrorMessage(error) },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/categories/[id] — delete category if not in use
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    const existing = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 })
    }

    // Check if category is used in any transactions
    if (existing._count.transactions > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Category is in use by transactions and cannot be deleted. Deactivate it instead.',
        },
        { status: 400 }
      )
    }

    await prisma.category.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Category deleted' })
  } catch (error) {
    console.error('DELETE /categories/[id] error:', error)
    return NextResponse.json(
      { success: false, message: getDatabaseErrorMessage(error) },
      { status: 500 }
    )
  }
}
