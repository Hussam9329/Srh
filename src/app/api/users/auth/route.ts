import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/users/auth - Simple login check
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { username: username.trim() },
    })

    if (!user) {
      return NextResponse.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'هذا الحساب معطل. تواصل مع المدير.' }, { status: 403 })
    }

    // Verify password
    const decodedPassword = Buffer.from(user.password, 'base64').toString('utf-8')
    if (decodedPassword !== password) {
      return NextResponse.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 })
    }

    // Return user info without password
    const { password: _, ...safeUser } = user
    return NextResponse.json({ ...safeUser, message: 'تم تسجيل الدخول بنجاح' })
  } catch (error) {
    console.error('Error during login:', error)
    return NextResponse.json({ error: 'فشل تسجيل الدخول' }, { status: 500 })
  }
}
