import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/reports/teacher/[id] - Complete teacher report
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
          const key = inst.installmentType
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

    // Institute deduction: 50,000 per paying student
    const INSTITUTE_DEDUCTION_PER_STUDENT = 50000
    const instituteDeduction = payingStudentsCount * INSTITUTE_DEDUCTION_PER_STUDENT
    const teacherShare = totalPaid - instituteDeduction

    // Get withdrawals
    const withdrawals = await db.teacherWithdrawal.findMany({
      where: { teacherId },
      orderBy: { withdrawalDate: 'desc' },
    })

    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0)
    const netBalance = teacherShare - totalWithdrawn

    // Aggregate payments by installment type across all students
    const allPaymentsByType: Record<string, number> = {}
    studentsData.forEach((s) => {
      Object.entries(s.paymentsByType).forEach(([type, amount]) => {
        allPaymentsByType[type] = (allPaymentsByType[type] || 0) + amount
      })
    })

    return NextResponse.json({
      teacher: {
        ...teacher,
        totalPaid,
        totalStudents,
        payingStudentsCount,
        instituteDeduction,
        teacherShare,
        totalWithdrawn,
        netBalance,
      },
      students: studentsData,
      withdrawals,
      paymentsByType: allPaymentsByType,
    })
  } catch (error) {
    console.error('Error generating teacher report:', error)
    return NextResponse.json(
      { error: 'Failed to generate teacher report' },
      { status: 500 }
    )
  }
}
