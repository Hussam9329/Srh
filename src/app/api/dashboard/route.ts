import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const totalStudents = await db.student.count();
    const totalTeachers = await db.teacher.count();
    const instBalance = await db.instituteBalance.findFirst() || { totalIncome: 0, totalWithdrawn: 0 };
    const teacherBalances = await db.teacher.aggregate({ _sum: { balance: true } });
    const recentPayments = await db.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { student: true }
    });

    return NextResponse.json({
      totalStudents,
      totalTeachers,
      instituteIncome: instBalance.totalIncome || 0,
      totalWithdrawn: instBalance.totalWithdrawn || 0,
      teacherBalancesRemaining: teacherBalances._sum.balance || 0,
      recentPayments
    });
  } catch {
    return NextResponse.json({ error: 'فشل في جلب الإحصائيات' }, { status: 500 });
  }
}
