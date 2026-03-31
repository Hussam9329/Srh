import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Simple offline password encoding (not secure for production, but fine for offline local app)
function encodePassword(password: string): string {
  return Buffer.from(password).toString('base64')
}

function decodePassword(encoded: string): string {
  return Buffer.from(encoded, 'base64').toString('utf-8')
}

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

    const user = await db.user.create({
      data: {
        username: username.trim(),
        password: encodePassword(password),
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
