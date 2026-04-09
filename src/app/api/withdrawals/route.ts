import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const withdrawals = await db.withdrawal.findMany({
      where: teacherId ? { teacherId } : {},
      orderBy: { createdAt: 'desc' },
      include: { teacher: true }
    });
    return NextResponse.json(withdrawals);
  } catch {
    return NextResponse.json({ error: 'فشل في جلب السحوبات' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teacherId, amount, note } = body;
    if (!teacherId || !amount) {
      return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 });
    }

    const teacher = await db.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) return NextResponse.json({ error: 'المدرس غير موجود' }, { status: 404 });
    if (teacher.balance < parseFloat(amount)) {
      return NextResponse.json({ error: 'رصيد غير كافي' }, { status: 400 });
    }

    await db.teacher.update({
      where: { id: teacherId },
      data: { balance: { decrement: parseFloat(amount) } }
    });

    let instBalance = await db.instituteBalance.findFirst();
    if (!instBalance) {
      instBalance = await db.instituteBalance.create({ data: { totalIncome: 0, totalWithdrawn: 0 } });
    }
    await db.instituteBalance.update({
      where: { id: instBalance.id },
      data: { totalWithdrawn: { increment: parseFloat(amount) } }
    });

    const withdrawal = await db.withdrawal.create({
      data: {
        teacherId,
        amount: parseFloat(amount),
        note: note || null
      },
      include: { teacher: true }
    });

    return NextResponse.json(withdrawal, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'فشل في تسجيل السحب' }, { status: 500 });
  }
}
