import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const students = await db.student.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        teachers: { include: { teacher: true } },
        payments: { orderBy: { createdAt: 'desc' } }
      }
    });
    return NextResponse.json(students);
  } catch {
    return NextResponse.json({ error: 'فشل في جلب الطلاب' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, studyType, teacherIds } = body;
    if (!name) return NextResponse.json({ error: 'اسم الطالب مطلوب' }, { status: 400 });

    const qrCode = `STD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const student = await db.student.create({
      data: {
        name,
        studyType: studyType || 'حضوري',
        qrCode,
        teachers: {
          create: (teacherIds || []).map((tid: string) => ({ teacherId: tid }))
        }
      },
      include: { teachers: { include: { teacher: true } } }
    });
    return NextResponse.json(student, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'فشل في إضافة الطالب' }, { status: 500 });
  }
}
