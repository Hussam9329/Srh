import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function encodePassword(password: string): string {
  return Buffer.from(password).toString('base64')
}

// GET /api/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = parseInt(id, 10)

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { password: _, ...safeUser } = user
    return NextResponse.json(safeUser)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = parseInt(id, 10)

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    const body = await request.json()
    const { fullName, username, role, isActive, password } = body

    // Check if user exists
    const existing = await db.user.findUnique({ where: { id: userId } })
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check username uniqueness if changed
    if (username && username !== existing.username) {
      const dup = await db.user.findUnique({ where: { username: username.trim() } })
      if (dup) {
        return NextResponse.json({ error: 'اسم المستخدم موجود بالفعل' }, { status: 409 })
      }
    }

    const updateData: any = {}
    if (fullName !== undefined) updateData.fullName = fullName.trim()
    if (username !== undefined) updateData.username = username.trim()
    if (role !== undefined) updateData.role = role
    if (isActive !== undefined) updateData.isActive = isActive
    if (password && password.length >= 4) updateData.password = encodePassword(password)

    const user = await db.user.update({
      where: { id: userId },
      data: updateData,
    })

    const { password: _, ...safeUser } = user
    return NextResponse.json(safeUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = parseInt(id, 10)

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    await db.user.delete({ where: { id: userId } })
    return NextResponse.json({ message: 'تم حذف المستخدم بنجاح' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
