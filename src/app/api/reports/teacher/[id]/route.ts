import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/reports/teacher/[id] - Complete teacher report
// Uses percentage-based deduction per installment type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const teacherId = parseInt(id, 10)

    if (isNaN(teacherId)) {
      return NextResponse.json({ error: 'Invalid teacher ID' }, { status: 400 })
    }

    // Get teacher details
    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Get all student links
    const studentLinks = await db.studentTeacher.findMany({
      where: { teacherId },
      include: {
        student: true,
      },
    })

    // Build student payment data grouped by installment type
    const studentsData = await Promise.all(
      studentLinks.map(async (link) => {
        const installments = await db.installment.findMany({
          where: {
            studentId: link.studentId,
            teacherId,
          },
          orderBy: { paymentDate: 'desc' },
        })

        const totalPaid = installments.reduce((sum, inst) => sum + inst.amount, 0)

        // Group payments by type
        const paymentsByType: Record<string, number> = {}
        installments.forEach((inst) => {
          const key = inst.installmentType || 'القسط الأول'
          paymentsByType[key] = (paymentsByType[key] || 0) + inst.amount
        })

        return {
          studentId: link.student.id,
          studentName: link.student.name,
          studentBarcode: link.student.barcode,
          studyType: link.student.studyType,
          status: link.student.status,
          totalPaid,
          hasPaid: totalPaid > 0,
          installmentCount: installments.length,
          paymentsByType,
          installments,
        }
      })
    )

    // Aggregate totals
    const totalPaid = studentsData.reduce((sum, s) => sum + s.totalPaid, 0)
    const totalStudents = studentsData.length
    const payingStudentsCount = studentsData.filter((s) => s.hasPaid).length

    // Institute deduction: percentage-based per installment type
    // Example: 30% total → 15% from course 1 payments + 15% from course 2 payments
    // If student pays in installments, percentage is taken from sum of all payments per course
    const institutePercentage = teacher.institutePercentage || 30
    const halfPercent = institutePercentage / 2

    // Aggregate payments by installment type across all students
    const allPaymentsByType: Record<string, number> = {}
    const deductionByType: Record<string, number> = {}
    let instituteDeduction = 0

    studentsData.forEach((s) => {
      Object.entries(s.paymentsByType).forEach(([type, amount]) => {
        allPaymentsByType[type] = (allPaymentsByType[type] || 0) + amount
      })
    })

    for (const [type, sum] of Object.entries(allPaymentsByType)) {
      const deduction = sum * (halfPercent / 100)
      deductionByType[type] = deduction
      instituteDeduction += deduction
    }

    const teacherShare = totalPaid - instituteDeduction

    // Get withdrawals
    const withdrawals = await db.teacherWithdrawal.findMany({
      where: { teacherId },
      orderBy: { withdrawalDate: 'desc' },
    })

    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0)
    const netBalance = teacherShare - totalWithdrawn

    return NextResponse.json({
      teacher: {
        ...teacher,
        totalPaid,
        totalStudents,
        payingStudentsCount,
        institutePercentage,
        instituteDeduction,
        deductionByType,
        teacherShare,
        totalWithdrawn,
        netBalance,
      },
      students: studentsData,
      withdrawals,
      paymentsByType: allPaymentsByType,
      deductionByType,
    })
  } catch (error) {
    console.error('Error generating teacher report:', error)
    return NextResponse.json(
      { error: 'Failed to generate teacher report' },
      { status: 500 }
    )
  }
}
