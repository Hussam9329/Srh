import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/stats - Return dashboard statistics
export async function GET() {
  try {
    // Student stats
    const totalStudents = await db.student.count()
    const activeStudents = await db.student.count({
      where: { status: 'مستمر' },
    })
    const withdrawnStudents = await db.student.count({
      where: { status: 'منسحب' },
    })
    const onlineStudentsCount = await db.student.count({
      where: { studyType: 'الكتروني' },
    })
    const offlineStudentsCount = await db.student.count({
      where: { studyType: 'حضوري' },
    })
    const studentsWithCard = await db.student.count({
      where: { hasCard: true },
    })
    const studentsWithBadge = await db.student.count({
      where: { hasBadge: true },
    })

    // Teacher stats
    const totalTeachers = await db.teacher.count()
    const uniqueSubjects = (await db.teacher.findMany({
      select: { subject: true },
      distinct: ['subject'],
    })).length

    // Payment stats
    const installmentAgg = await db.installment.aggregate({
      _sum: { amount: true },
    })
    const totalPaymentsReceived = installmentAgg._sum.amount || 0

    // Withdrawal stats
    const withdrawalAgg = await db.teacherWithdrawal.aggregate({
      _sum: { amount: true },
    })
    const totalWithdrawn = withdrawalAgg._sum.amount || 0

    return NextResponse.json({
      totalStudents,
      activeStudents,
      withdrawnStudents,
      totalTeachers,
      uniqueSubjects,
      totalPaymentsReceived,
      totalWithdrawn,
      onlineStudentsCount,
      offlineStudentsCount,
      studentsWithCard,
      studentsWithBadge,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
