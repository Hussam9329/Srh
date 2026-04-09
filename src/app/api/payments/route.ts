import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const payments = await db.payment.findMany({
      where: studentId ? { studentId } : {},
      orderBy: { createdAt: 'desc' },
      include: { student: true }
    });
    return NextResponse.json(payments);
  } catch {
    return NextResponse.json({ error: 'فشل في جلب المدفوعات' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, amount, description } = body;
    if (!studentId || !amount) {
      return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 });
    }

    const paymentAmount = parseFloat(amount);
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: { teachers: { include: { teacher: true } } }
    });

    if (!student) return NextResponse.json({ error: 'الطالب غير موجود' }, { status: 404 });
    if (student.teachers.length === 0) return NextResponse.json({ error: 'الطالب غير مرتبط بأي مدرس' }, { status: 400 });

    const distributions: { teacherId: string; amount: number; teacherName: string }[] = [];
    let totalInstitute = 0;
    let totalTeacher = 0;

    for (const ts of student.teachers) {
      const instituteShare = paymentAmount * (ts.teacher.percentage / 100);
      const teacherShare = paymentAmount - instituteShare;
      totalInstitute += instituteShare;
      totalTeacher += teacherShare;
      distributions.push({
        teacherId: ts.teacher.id,
        amount: teacherShare,
        teacherName: ts.teacher.name
      });
      await db.teacher.update({
        where: { id: ts.teacher.id },
        data: { balance: { increment: teacherShare } }
      });
    }

    let instBalance = await db.instituteBalance.findFirst();
    if (!instBalance) {
      instBalance = await db.instituteBalance.create({ data: { totalIncome: 0, totalWithdrawn: 0 } });
    }
    await db.instituteBalance.update({
      where: { id: instBalance.id },
      data: { totalIncome: { increment: totalInstitute } }
    });

    const payment = await db.payment.create({
      data: {
        studentId,
        amount: paymentAmount,
        instituteAmount: totalInstitute,
        teacherAmount: totalTeacher,
        description: description || null,
        teacherDistributions: JSON.stringify(distributions)
      }
    });

    return NextResponse.json({ payment, distributions }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'فشل في تسجيل الدفعة' }, { status: 500 });
  }
}
