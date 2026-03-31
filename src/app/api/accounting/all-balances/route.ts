import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/accounting/all-balances - Return balance for ALL teachers
// Uses percentage-based deduction per installment type (as discussed)
export async function GET() {
  try {
    const teachers = await db.teacher.findMany({
      orderBy: { id: 'desc' },
    })

    const balances = await Promise.all(
      teachers.map(async (teacher) => {
        // Get all installments for this teacher's students
        const installments = await db.installment.findMany({
          where: { teacherId: teacher.id },
        })

        const totalPaid = installments.reduce((sum, inst) => sum + inst.amount, 0)

        // Unique paying students
        const payingStudentIds = new Set(
          installments
            .filter((inst) => inst.amount > 0)
            .map((inst) => inst.studentId)
        )
        const payingStudentsCount = payingStudentIds.size

        // Total students
        const totalStudents = await db.studentTeacher.count({
          where: { teacherId: teacher.id },
        })

        // Institute deduction: percentage-based per installment type
        // Example: 30% total → 15% from course 1 payments + 15% from course 2 payments
        const institutePercentage = teacher.institutePercentage || 30
        const halfPercent = institutePercentage / 2

        // Group payments by installment type
        const paymentsByType: Record<string, number> = {}
        installments.forEach((inst) => {
          const key = inst.installmentType || 'القسط الأول'
          paymentsByType[key] = (paymentsByType[key] || 0) + inst.amount
        })

        // Calculate deduction per installment type
        let instituteDeduction = 0
        for (const [, sum] of Object.entries(paymentsByType)) {
          instituteDeduction += sum * (halfPercent / 100)
        }

        const teacherShare = totalPaid - instituteDeduction

        // Total withdrawn
        const withdrawals = await db.teacherWithdrawal.findMany({
          where: { teacherId: teacher.id },
        })
        const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0)

        const remaining = teacherShare - totalWithdrawn

        return {
          teacherId: teacher.id,
          teacherName: teacher.name,
          subject: teacher.subject,
          institutePercentage,
          totalPaid,
          payingStudentsCount,
          totalStudents,
          instituteDeduction,
          teacherShare,
          totalWithdrawn,
          remaining,
        }
      })
    )

    return NextResponse.json(balances)
  } catch (error) {
    console.error('Error calculating all balances:', error)
    return NextResponse.json(
      { error: 'Failed to calculate all balances' },
      { status: 500 }
    )
  }
}
