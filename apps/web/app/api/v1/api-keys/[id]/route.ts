import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDatabaseErrorMessage } from '@/lib/database-error'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { isActive, permissions, name } = body

    const existingKey = await (prisma as any).apiKey.findUnique({
      where: { id },
    })

    if (!existingKey) {
      return NextResponse.json(
        { success: false, message: 'API key not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, any> = {}
    if (typeof isActive === 'boolean') updateData.isActive = isActive
    if (Array.isArray(permissions)) updateData.permissions = permissions
    if (name && typeof name === 'string') updateData.name = name.trim()

    const updatedKey = await (prisma as any).apiKey.update({
      where: { id },
      data: updateData,
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
      message: 'API Key updated successfully',
      data: updatedKey,
    })
  } catch (error) {
    console.error('Failed to update API key:', error)
    return NextResponse.json(
      {
        success: false,
        message: getDatabaseErrorMessage(error),
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existingKey = await (prisma as any).apiKey.findUnique({
      where: { id },
    })

    if (!existingKey) {
      return NextResponse.json(
        { success: false, message: 'API key not found' },
        { status: 404 }
      )
    }

    await (prisma as any).apiKey.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'API Key revoked and deleted successfully',
      data: { id },
    })
  } catch (error) {
    console.error('Failed to delete API key:', error)
    return NextResponse.json(
      {
        success: false,
        message: getDatabaseErrorMessage(error),
      },
      { status: 500 }
    )
  }
}
