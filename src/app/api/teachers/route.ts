import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const teachers = await db.teacher.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { students: true } } }
    });
    return NextResponse.json(teachers);
  } catch {
    return NextResponse.json({ error: 'فشل في جلب المدرسين' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, subject, percentage } = body;
    if (!name || !subject || percentage === undefined) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }
    const teacher = await db.teacher.create({
      data: { name, subject, percentage: parseFloat(percentage) }
    });
    return NextResponse.json(teacher, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'فشل في إضافة المدرس' }, { status: 500 });
  }
}
