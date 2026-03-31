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

    // Institute deduction: percentage-based per installment type
    // Example: 30% total → 15% from course 1 payments + 15% from course 2 payments
    // If student pays in installments, the percentage is taken from the sum of all payments per course
    const institutePercentage = teacher.institutePercentage || 30
    const halfPercent = institutePercentage / 2

    // Group payments by installment type
    const paymentsByType: Record<string, number> = {}
    installments.forEach((inst) => {
      const key = inst.installmentType || 'القسط الأول'
      paymentsByType[key] = (paymentsByType[key] || 0) + inst.amount
    })

    // Calculate deduction per installment type
    const deductionByType: Record<string, number> = {}
    let instituteDeduction = 0
    for (const [type, sum] of Object.entries(paymentsByType)) {
      const deduction = sum * (halfPercent / 100)
      deductionByType[type] = deduction
      instituteDeduction += deduction
    }

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
      subject: teacher.subject,
      institutePercentage,
      totalPaid,
      payingStudentsCount,
      totalStudents,
      instituteDeduction,
      deductionByType,
      paymentsByType,
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
