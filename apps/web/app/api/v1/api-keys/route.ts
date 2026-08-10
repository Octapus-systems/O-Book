import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { getDatabaseErrorMessage } from '@/lib/database-error'

export async function GET(request: NextRequest) {
  try {
    const user = await prisma.user.findFirst()
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const keys = await (prisma as any).apiKey.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        displayKey: true,
        permissions: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: keys,
    })
  } catch (error) {
    console.error('Failed to fetch API keys:', error)
    return NextResponse.json(
      {
        success: false,
        message: getDatabaseErrorMessage(error),
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, permissions, expiresInDays } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'API Key name is required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findFirst()
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Generate secure API key
    const rawBytes = crypto.randomBytes(24).toString('hex')
    const fullKey = `obook_live_${rawBytes}`
    const displayKey = `obook_live_••••${fullKey.slice(-4)}`

    // Calculate expiration if provided
    let expiresAt: Date | null = null
    if (expiresInDays && typeof expiresInDays === 'number' && expiresInDays > 0) {
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiresInDays)
    }

    const formattedPermissions = Array.isArray(permissions) && permissions.length > 0
      ? permissions
      : ['*']

    const newKey = await (prisma as any).apiKey.create({
      data: {
        name: name.trim(),
        key: fullKey,
        displayKey,
        permissions: formattedPermissions,
        expiresAt,
        userId: user.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'API Key created successfully. Make sure to copy your key now as you will not be able to see it again!',
      data: {
        id: newKey.id,
        name: newKey.name,
        key: fullKey, // Plain text key returned ONLY ONCE upon creation
        displayKey: newKey.displayKey,
        permissions: newKey.permissions,
        expiresAt: newKey.expiresAt,
        createdAt: newKey.createdAt,
      },
    })
  } catch (error) {
    console.error('Failed to create API key:', error)
    return NextResponse.json(
      {
        success: false,
        message: getDatabaseErrorMessage(error),
      },
      { status: 500 }
    )
  }
}
