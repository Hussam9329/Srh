import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/teachers/[id]/students - Get all students linked to a teacher with payment totals
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

    // Verify teacher exists
    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Get all linked students
    const links = await db.studentTeacher.findMany({
      where: { teacherId },
      include: {
        student: true,
      },
    })

    // Fetch installments per student-teacher pair
    const studentsWithPayments = await Promise.all(
      links.map(async (link) => {
        const installments = await db.installment.findMany({
          where: {
            studentId: link.studentId,
            teacherId,
          },
          orderBy: { paymentDate: 'desc' },
        })

        const totalPaid = installments.reduce((sum, inst) => sum + inst.amount, 0)

        return {
          student: link.student,
          totalPaid,
          installmentCount: installments.length,
          installments,
        }
      })
    )

    return NextResponse.json({
      teacher,
      students: studentsWithPayments,
    })
  } catch (error) {
    console.error('Error fetching teacher students:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teacher students' },
      { status: 500 }
    )
  }
}
