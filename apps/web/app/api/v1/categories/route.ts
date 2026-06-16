import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDatabaseErrorMessage } from '@/lib/database-error'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        ...(type === 'CASH_IN' || type === 'CASH_OUT' ? { type } : {}),
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(
      { success: true, data: categories },
      { headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=600' } }
    )
  } catch (error) {
    console.error('Fetch categories error:', error)
    return NextResponse.json(
      { success: false, message: getDatabaseErrorMessage(error), error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
