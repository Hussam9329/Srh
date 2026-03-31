import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/teachers - List all teachers with optional search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const teachers = await db.teacher.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { subject: { contains: search } },
            ],
          }
        : undefined,
      include: {
        _count: {
          select: { students: true },
        },
      },
      orderBy: { id: 'desc' },
    })

    return NextResponse.json(teachers)
  } catch (error) {
    console.error('Error fetching teachers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teachers' },
      { status: 500 }
    )
  }
}

// POST /api/teachers - Create new teacher
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, subject, totalFee, institutePercentage, notes } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Teacher name is required' },
        { status: 400 }
      )
    }

    if (!subject || typeof subject !== 'string' || subject.trim() === '') {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      )
    }

    const teacher = await db.teacher.create({
      data: {
        name: name.trim(),
        subject: subject.trim(),
        totalFee: totalFee ?? 0,
        institutePercentage: institutePercentage ?? 30,
        notes: notes || null,
      },
    })

    return NextResponse.json(teacher, { status: 201 })
  } catch (error) {
    console.error('Error creating teacher:', error)
    return NextResponse.json(
      { error: 'Failed to create teacher' },
      { status: 500 }
    )
  }
}
