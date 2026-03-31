import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'

// GET /api/users - List all users
export async function GET() {
  try {
    const users = await db.user.findMany({
      orderBy: { id: 'desc' },
    })

    // Exclude password from response
    const safeUsers = users.map(({ password: _, ...user }) => user)
    return NextResponse.json(safeUsers)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// POST /api/users - Create user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, fullName, role, isActive } = body

    if (!username || !password || !fullName) {
      return NextResponse.json({ error: 'اسم المستخدم وكلمة المرور والاسم الكامل مطلوبان' }, { status: 400 })
    }

    if (password.length < 4) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل' }, { status: 400 })
    }

    // Check if username exists
    const existing = await db.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json({ error: 'اسم المستخدم موجود بالفعل' }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password);

    const user = await db.user.create({
      data: {
        username: username.trim(),
        password: hashedPassword,
        fullName: fullName.trim(),
        role: role || 'user',
        isActive: isActive !== false,
      },
    })

    // Exclude password from response
    const { password: _, ...safeUser } = user
    return NextResponse.json(safeUser, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
