import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDatabaseErrorMessage } from '@/lib/database-error'

// GET /api/v1/categories — list categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const all = searchParams.get('all') === 'true'

    const categories = await prisma.category.findMany({
      where: {
        ...(all ? {} : { isActive: true }),
        ...(type === 'CASH_IN' || type === 'CASH_OUT' ? { type } : {}),
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(
      { success: true, data: categories },
      { headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=60' } }
    )
  } catch (error) {
    console.error('Fetch categories error:', error)
    return NextResponse.json(
      { success: false, message: getDatabaseErrorMessage(error), error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

// POST /api/v1/categories — create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, description, color, isActive } = body

    if (!name?.trim() || !type) {
      return NextResponse.json(
        { success: false, message: 'name and type are required' },
        { status: 400 }
      )
    }

    if (type !== 'CASH_IN' && type !== 'CASH_OUT') {
      return NextResponse.json(
        { success: false, message: 'type must be CASH_IN or CASH_OUT' },
        { status: 400 }
      )
    }

    const trimmedName = name.trim()

    // Check if duplicate name exists (case insensitive or exact)
    const existing = await prisma.category.findUnique({
      where: { name: trimmedName },
    })
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Category name already exists' },
        { status: 409 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name: trimmedName,
        type,
        description: description?.trim() || null,
        color: color?.trim() || null,
        isActive: isActive !== false,
      },
    })

    return NextResponse.json({ success: true, data: category })
  } catch (error) {
    console.error('POST /categories error:', error)
    return NextResponse.json(
      { success: false, message: getDatabaseErrorMessage(error) },
      { status: 500 }
    )
  }
}
