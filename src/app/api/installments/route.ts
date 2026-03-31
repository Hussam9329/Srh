import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/installments - Get installments for a student+teacher pair
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const teacherId = searchParams.get('teacherId')

    if (!studentId || !teacherId) {
      return NextResponse.json(
        { error: 'studentId and teacherId query params are required' },
        { status: 400 }
      )
    }

    const installments = await db.installment.findMany({
      where: {
        studentId: parseInt(studentId, 10),
        teacherId: parseInt(teacherId, 10),
      },
      orderBy: { paymentDate: 'desc' },
    })

    return NextResponse.json(installments)
  } catch (error) {
    console.error('Error fetching installments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch installments' },
      { status: 500 }
    )
  }
}

// POST /api/installments - Create installment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, teacherId, amount, notes, installmentType } = body

    if (!studentId || !teacherId || amount === undefined) {
      return NextResponse.json(
        { error: 'studentId, teacherId, and amount are required' },
        { status: 400 }
      )
    }

    const installment = await db.installment.create({
      data: {
        studentId: parseInt(studentId, 10),
        teacherId: parseInt(teacherId, 10),
        amount: parseFloat(amount),
        notes: notes || null,
        installmentType: installmentType || 'القسط الأول',
      },
    })

    return NextResponse.json(installment, { status: 201 })
  } catch (error: any) {
    console.error('Error creating installment:', error)
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid studentId or teacherId - foreign key constraint failed' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create installment' },
      { status: 500 }
    )
  }
}
