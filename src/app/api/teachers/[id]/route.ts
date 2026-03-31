import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/teachers/[id] - Get single teacher with student count
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

    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
      include: {
        _count: {
          select: { students: true },
        },
        students: {
          include: {
            student: true,
          },
        },
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    return NextResponse.json(teacher)
  } catch (error) {
    console.error('Error fetching teacher:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teacher' },
      { status: 500 }
    )
  }
}

// PUT /api/teachers/[id] - Update teacher
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const teacherId = parseInt(id, 10)

    if (isNaN(teacherId)) {
      return NextResponse.json({ error: 'Invalid teacher ID' }, { status: 400 })
    }

    const body = await request.json()
    const { name, subject, totalFee, institutePercentage, notes } = body

    const teacher = await db.teacher.update({
      where: { id: teacherId },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(subject !== undefined ? { subject: subject.trim() } : {}),
        ...(totalFee !== undefined ? { totalFee: parseFloat(totalFee) } : {}),
        ...(institutePercentage !== undefined ? { institutePercentage: parseInt(institutePercentage, 10) } : {}),
        ...(notes !== undefined ? { notes: notes || null } : {}),
      },
    })

    return NextResponse.json(teacher)
  } catch (error: any) {
    console.error('Error updating teacher:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to update teacher' },
      { status: 500 }
    )
  }
}

// DELETE /api/teachers/[id] - Delete teacher
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const teacherId = parseInt(id, 10)

    if (isNaN(teacherId)) {
      return NextResponse.json({ error: 'Invalid teacher ID' }, { status: 400 })
    }

    await db.teacher.delete({
      where: { id: teacherId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting teacher:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to delete teacher' },
      { status: 500 }
    )
  }
}
