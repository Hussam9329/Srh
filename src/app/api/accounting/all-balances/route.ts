import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/accounting/all-balances - Return balance for ALL teachers
export async function GET() {
  try {
    const teachers = await db.teacher.findMany({
      orderBy: { id: 'desc' },
    })

    const INSTITUTE_DEDUCTION_PER_STUDENT = 50000

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

        const instituteDeduction = payingStudentsCount * INSTITUTE_DEDUCTION_PER_STUDENT
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
