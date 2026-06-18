import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/prisma'
import { getDatabaseErrorMessage } from '@/lib/database-error'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pin } = body

    if (!pin || pin.length !== 4) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid PIN format',
          error: 'INVALID_PIN_FORMAT',
        },
        { status: 400 }
      )
    }

    const users = await prisma.user.findMany({
      include: { role: true },
    })

    let authenticatedUser = null
    for (const user of users) {
      const isValid = await bcrypt.compare(pin, user.pin)
      if (isValid) {
        authenticatedUser = user
        break
      }
    }

    if (!authenticatedUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'Incorrect PIN',
          error: 'INVALID_CREDENTIALS',
        },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: authenticatedUser.id,
          name: authenticatedUser.name,
          email: authenticatedUser.email,
          role: authenticatedUser.role.slug,
        },
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      {
        success: false,
        message: getDatabaseErrorMessage(error),
        error: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}
