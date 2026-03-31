import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/reports/student/[id] - Complete student report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const studentId = parseInt(id, 10)

    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 })
    }

    // Get student details
    const student = await db.student.findUnique({
      where: { id: studentId },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Get all teacher links
    const teacherLinks = await db.studentTeacher.findMany({
      where: { studentId },
      include: {
        teacher: true,
      },
    })

    // Build report data with installments fetched per teacher link
    const teachersData = await Promise.all(
      teacherLinks.map(async (link) => {
        const installments = await db.installment.findMany({
          where: {
            studentId,
            teacherId: link.teacherId,
          },
          orderBy: { paymentDate: 'desc' },
        })

        const totalPaid = installments.reduce((sum, inst) => sum + inst.amount, 0)

        return {
          teacherId: link.teacher.id,
          teacherName: link.teacher.name,
          subject: link.teacher.subject,
          totalFee: link.teacher.totalFee,
          remaining: link.teacher.totalFee - totalPaid,
          totalPaid,
          installmentCount: installments.length,
          installments,
        }
      })
    )

    const overallTotalPaid = teachersData.reduce((sum, t) => sum + t.totalPaid, 0)
    const overallTotalFee = teachersData.reduce((sum, t) => sum + t.totalFee, 0)

    return NextResponse.json({
      student,
      teachers: teachersData,
      summary: {
        totalTeachers: teachersData.length,
        overallTotalPaid,
        overallTotalFee,
        overallRemaining: overallTotalFee - overallTotalPaid,
      },
    })
  } catch (error) {
    console.error('Error generating student report:', error)
    return NextResponse.json(
      { error: 'Failed to generate student report' },
      { status: 500 }
    )
  }
}
