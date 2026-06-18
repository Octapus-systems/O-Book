import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDatabaseErrorMessage } from '@/lib/database-error'
import bcrypt from 'bcrypt'

type Params = { params: Promise<{ id: string }> }

// PATCH /api/v1/users/[id] — update name, email, role, or PIN
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, email, pin, roleSlug } = body

    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    const allowedRoles = ['ADMIN', 'ACCOUNTANT', 'CEO']

    let roleId = existing.roleId
    if (roleSlug) {
      if (!allowedRoles.includes(roleSlug)) {
        return NextResponse.json(
          { success: false, message: 'Invalid role' },
          { status: 400 }
        )
      }
      const role = await prisma.role.findUnique({ where: { slug: roleSlug } })
      if (!role) {
        return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 })
      }
      roleId = role.id
    }

    // Check email uniqueness if changing
    if (email && email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } })
      if (emailTaken) {
        return NextResponse.json({ success: false, message: 'Email already in use' }, { status: 409 })
      }
    }

    const updateData: Record<string, unknown> = { roleId }
    if (name?.trim()) updateData.name = name.trim()
    if (email?.trim()) updateData.email = email.trim()
    if (pin) {
      if (!/^\d{4}$/.test(pin)) {
        return NextResponse.json({ success: false, message: 'PIN must be 4 digits' }, { status: 400 })
      }
      updateData.pin = await bcrypt.hash(pin, 10)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: true },
    })

    return NextResponse.json({
      success: true,
      message: 'User updated',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: { id: user.role.id, name: user.role.name, slug: user.role.slug },
      },
    })
  } catch (error) {
    console.error('PATCH /users/[id] error:', error)
    return NextResponse.json(
      { success: false, message: getDatabaseErrorMessage(error) },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/users/[id]
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    await prisma.user.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'User deleted' })
  } catch (error) {
    console.error('DELETE /users/[id] error:', error)
    return NextResponse.json(
      { success: false, message: getDatabaseErrorMessage(error) },
      { status: 500 }
    )
  }
}
