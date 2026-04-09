import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const student = await db.student.findUnique({
      where: { id },
      include: {
        teachers: { include: { teacher: true } },
        payments: { orderBy: { createdAt: 'desc' } }
      }
    });
    if (!student) return NextResponse.json({ error: 'الطالب غير موجود' }, { status: 404 });
    return NextResponse.json(student);
  } catch {
    return NextResponse.json({ error: 'فشل في جلب بيانات الطالب' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.student.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'فشل في حذف الطالب' }, { status: 500 });
  }
}
