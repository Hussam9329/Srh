import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/student-teacher - Link student to teacher
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, teacherId } = body

    if (!studentId || !teacherId) {
      return NextResponse.json(
        { error: 'studentId and teacherId are required' },
        { status: 400 }
      )
    }

    // Verify both exist
    const student = await db.student.findUnique({ where: { id: parseInt(studentId, 10) } })
    const teacher = await db.teacher.findUnique({ where: { id: parseInt(teacherId, 10) } })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const link = await db.studentTeacher.create({
      data: {
        studentId: parseInt(studentId, 10),
        teacherId: parseInt(teacherId, 10),
      },
      include: {
        student: true,
        teacher: true,
      },
    })

    return NextResponse.json(link, { status: 201 })
  } catch (error: any) {
    console.error('Error linking student to teacher:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'This student is already linked to this teacher' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to link student to teacher' },
      { status: 500 }
    )
  }
}

// DELETE /api/student-teacher - Unlink student from teacher
export async function DELETE(request: NextRequest) {
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

    await db.studentTeacher.delete({
      where: {
        studentId_teacherId: {
          studentId: parseInt(studentId, 10),
          teacherId: parseInt(teacherId, 10),
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error unlinking student from teacher:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Student-teacher link not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to unlink student from teacher' },
      { status: 500 }
    )
  }
}
