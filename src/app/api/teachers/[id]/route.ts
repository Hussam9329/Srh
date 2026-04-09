import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const teacher = await db.teacher.findUnique({
      where: { id },
      include: {
        students: { include: { student: true } },
        withdrawals: { orderBy: { createdAt: 'desc' } }
      }
    });
    if (!teacher) return NextResponse.json({ error: 'المدرس غير موجود' }, { status: 404 });
    return NextResponse.json(teacher);
  } catch {
    return NextResponse.json({ error: 'فشل في جلب بيانات المدرس' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.teacher.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'فشل في حذف المدرس' }, { status: 500 });
  }
}
