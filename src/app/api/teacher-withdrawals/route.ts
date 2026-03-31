import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/teacher-withdrawals - Get withdrawals for a teacher
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')

    if (!teacherId) {
      return NextResponse.json(
        { error: 'teacherId query param is required' },
        { status: 400 }
      )
    }

    const withdrawals = await db.teacherWithdrawal.findMany({
      where: {
        teacherId: parseInt(teacherId, 10),
      },
      orderBy: { withdrawalDate: 'desc' },
    })

    return NextResponse.json(withdrawals)
  } catch (error) {
    console.error('Error fetching withdrawals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch withdrawals' },
      { status: 500 }
    )
  }
}

// POST /api/teacher-withdrawals - Create withdrawal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { teacherId, amount, notes } = body

    if (!teacherId || amount === undefined) {
      return NextResponse.json(
        { error: 'teacherId and amount are required' },
        { status: 400 }
      )
    }

    const withdrawal = await db.teacherWithdrawal.create({
      data: {
        teacherId: parseInt(teacherId, 10),
        amount: parseFloat(amount),
        notes: notes || null,
      },
    })

    return NextResponse.json(withdrawal, { status: 201 })
  } catch (error: any) {
    console.error('Error creating withdrawal:', error)
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid teacherId - foreign key constraint failed' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create withdrawal' },
      { status: 500 }
    )
  }
}
