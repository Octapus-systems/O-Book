import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDatabaseErrorMessage } from '@/lib/database-error'
import bcrypt from 'bcrypt'

// GET /api/v1/users — list all users with their roles
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: 'asc' },
    })

    const data = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: {
        id: u.role.id,
        name: u.role.name,
        slug: u.role.slug,
      },
      createdAt: u.createdAt.toISOString(),
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('GET /users error:', error)
    return NextResponse.json(
      { success: false, message: getDatabaseErrorMessage(error) },
      { status: 500 }
    )
  }
}

// POST /api/v1/users — create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, pin, roleSlug } = body

    if (!name?.trim() || !email?.trim() || !pin?.trim() || !roleSlug) {
      return NextResponse.json(
        { success: false, message: 'name, email, pin and roleSlug are required' },
        { status: 400 }
      )
    }

    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { success: false, message: 'PIN must be exactly 4 digits' },
        { status: 400 }
      )
    }

    // Only allow 3 roles
    const allowedRoles = ['ADMIN', 'ACCOUNTANT', 'CEO']
    if (!allowedRoles.includes(roleSlug)) {
      return NextResponse.json(
        { success: false, message: 'Invalid role. Allowed: ADMIN, ACCOUNTANT, CEO' },
        { status: 400 }
      )
    }

    const role = await prisma.role.findUnique({ where: { slug: roleSlug } })
    if (!role) {
      return NextResponse.json(
        { success: false, message: `Role ${roleSlug} not found in database` },
        { status: 404 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Email already in use' },
        { status: 409 }
      )
    }

    const hashedPin = await bcrypt.hash(pin, 10)

    const user = await prisma.user.create({
      data: { name, email, pin: hashedPin, roleId: role.id },
      include: { role: true },
    })

    return NextResponse.json({
      success: true,
      message: 'User created',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: { id: user.role.id, name: user.role.name, slug: user.role.slug },
      },
    })
  } catch (error) {
    console.error('POST /users error:', error)
    return NextResponse.json(
      { success: false, message: getDatabaseErrorMessage(error) },
      { status: 500 }
    )
  }
}
