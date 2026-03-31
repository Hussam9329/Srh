import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/accounting/balance/[teacherId] - Calculate teacher balance
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  try {
    const { teacherId: teacherIdStr } = await params
    const teacherId = parseInt(teacherIdStr, 10)

    if (isNaN(teacherId)) {
      return NextResponse.json({ error: 'Invalid teacher ID' }, { status: 400 })
    }

    // Verify teacher exists
    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Get all installments for this teacher's students
    const installments = await db.installment.findMany({
      where: { teacherId },
    })

    // total_paid = SUM of all installment amounts for this teacher's students
    const totalPaid = installments.reduce((sum, inst) => sum + inst.amount, 0)

    // Get unique paying students (those who have paid > 0)
    const payingStudentIds = new Set(
      installments
        .filter((inst) => inst.amount > 0)
        .map((inst) => inst.studentId)
    )
    const payingStudentsCount = payingStudentIds.size

    // Total students linked to this teacher
    const totalStudents = await db.studentTeacher.count({
      where: { teacherId },
    })

    // Institute deduction: 50,000 per paying student
    const INSTITUTE_DEDUCTION_PER_STUDENT = 50000
    const instituteDeduction = payingStudentsCount * INSTITUTE_DEDUCTION_PER_STUDENT

    // Teacher share
    const teacherShare = totalPaid - instituteDeduction

    // Total withdrawn
    const withdrawals = await db.teacherWithdrawal.findMany({
      where: { teacherId },
    })
    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0)

    // Remaining balance
    const remaining = teacherShare - totalWithdrawn

    return NextResponse.json({
      teacherId,
      teacherName: teacher.name,
      totalPaid,
      payingStudentsCount,
      totalStudents,
      instituteDeduction,
      teacherShare,
      totalWithdrawn,
      remaining,
    })
  } catch (error) {
    console.error('Error calculating teacher balance:', error)
    return NextResponse.json(
      { error: 'Failed to calculate teacher balance' },
      { status: 500 }
    )
  }
}
