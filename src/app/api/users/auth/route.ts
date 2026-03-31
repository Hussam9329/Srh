import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comparePassword, hashPassword } from '@/lib/password'

// POST /api/users/auth - Login with bcrypt password verification
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

    // Check if the password is old base64 format and needs migration
    let isMatch = false
    if (user.password.startsWith('$2') || user.password.startsWith('$2a') || user.password.startsWith('$2b')) {
      // Already bcrypt hash
      isMatch = await comparePassword(password, user.password)
    } else {
      // Legacy base64 format — verify and auto-migrate
      try {
        const decodedPassword = Buffer.from(user.password, 'base64').toString('utf-8')
        isMatch = decodedPassword === password

        if (isMatch) {
          // Auto-migrate: re-hash with bcrypt
          const hashedPassword = await hashPassword(password)
          await db.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
          })
        }
      } catch {
        // If base64 decode fails, try bcrypt as fallback
        isMatch = await comparePassword(password, user.password)
      }
    }

    if (!isMatch) {
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
