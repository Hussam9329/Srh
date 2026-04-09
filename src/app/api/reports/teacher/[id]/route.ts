import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const teacher = await db.teacher.findUnique({
      where: { id },
      include: {
        students: { include: { student: { include: { payments: true } } } },
        withdrawals: { orderBy: { createdAt: 'desc' } }
      }
    });
    if (!teacher) return NextResponse.json({ error: 'المدرس غير موجود' }, { status: 404 });

    const allPayments = await db.payment.findMany({
      orderBy: { createdAt: 'desc' }
    });

    let totalReceived = 0;
    for (const p of allPayments) {
      try {
        const dist = JSON.parse(p.teacherDistributions);
        const myDist = dist.find((d: { teacherId: string }) => d.teacherId === id);
        if (myDist) totalReceived += myDist.amount;
      } catch { /* skip */ }
    }

    const totalWithdrawn = teacher.withdrawals.reduce((sum, w) => sum + w.amount, 0);

    return NextResponse.json({
      teacher,
      totalReceived,
      totalWithdrawn,
      currentBalance: teacher.balance,
      students: teacher.students.map(ts => ({
        ...ts.student,
        totalPaid: ts.student.payments.reduce((s, p) => s + p.amount, 0)
      })),
      withdrawals: teacher.withdrawals
    });
  } catch {
    return NextResponse.json({ error: 'فشل في جلب التقرير' }, { status: 500 });
  }
}
