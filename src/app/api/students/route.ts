import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/students - List all students with optional search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const students = await db.student.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { barcode: { contains: search } },
              { status: { contains: search } },
              { studyType: { contains: search } },
            ],
          }
        : undefined,
      include: {
        teachers: {
          include: {
            teacher: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    })

    return NextResponse.json(students)
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}

// POST /api/students - Create new student with auto-generated barcode
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, studyType, hasCard, hasBadge, status, notes } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Student name is required' },
        { status: 400 }
      )
    }

    // Generate barcode: find max existing BN-XXXX and increment
    const students = await db.student.findMany({
      select: { barcode: true },
      orderBy: { id: 'desc' },
    })

    let maxNum = 0
    for (const s of students) {
      const match = s.barcode.match(/^BN-(\d+)$/)
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxNum) maxNum = num
      }
    }

    const nextNum = maxNum + 1
    const barcode = `BN-${nextNum.toString().padStart(4, '0')}`

    const student = await db.student.create({
      data: {
        name: name.trim(),
        studyType: studyType || 'حضوري',
        hasCard: hasCard ?? false,
        hasBadge: hasBadge ?? false,
        status: status || 'مستمر',
        barcode,
        notes: notes || null,
      },
    })

    return NextResponse.json(student, { status: 201 })
  } catch (error) {
    console.error('Error creating student:', error)
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    )
  }
}
