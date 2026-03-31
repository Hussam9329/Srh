import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/students/[id] - Get single student
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

    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        teachers: {
          include: {
            teacher: true,
          },
        },
        installments: true,
      },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    return NextResponse.json(student)
  } catch (error) {
    console.error('Error fetching student:', error)
    return NextResponse.json(
      { error: 'Failed to fetch student' },
      { status: 500 }
    )
  }
}

// PUT /api/students/[id] - Update student
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const studentId = parseInt(id, 10)

    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 })
    }

    const body = await request.json()
    const { name, studyType, hasCard, hasBadge, status, barcode, notes } = body

    const student = await db.student.update({
      where: { id: studentId },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(studyType !== undefined ? { studyType } : {}),
        ...(hasCard !== undefined ? { hasCard } : {}),
        ...(hasBadge !== undefined ? { hasBadge } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(barcode !== undefined ? { barcode } : {}),
        ...(notes !== undefined ? { notes: notes || null } : {}),
      },
    })

    return NextResponse.json(student)
  } catch (error: any) {
    console.error('Error updating student:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    )
  }
}

// DELETE /api/students/[id] - Delete student
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const studentId = parseInt(id, 10)

    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 })
    }

    await db.student.delete({
      where: { id: studentId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting student:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    )
  }
}
