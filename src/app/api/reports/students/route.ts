import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const students = await db.student.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        teachers: { include: { teacher: true } },
        payments: { orderBy: { createdAt: 'desc' } }
      }
    });
    const report = students.map(s => ({
      id: s.id,
      name: s.name,
      studyType: s.studyType,
      qrCode: s.qrCode,
      teachers: s.teachers.map(ts => ts.teacher.name),
      totalPaid: s.payments.reduce((sum, p) => sum + p.amount, 0),
      paymentsCount: s.payments.length,
      createdAt: s.createdAt
    }));
    return NextResponse.json(report);
  } catch {
    return NextResponse.json({ error: 'فشل في جلب التقرير' }, { status: 500 });
  }
}
