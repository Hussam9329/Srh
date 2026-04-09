import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const students = await db.student.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { qrCode: { contains: q } }
        ]
      },
      include: {
        teachers: { include: { teacher: true } },
        payments: { orderBy: { createdAt: 'desc' } }
      }
    });
    return NextResponse.json(students);
  } catch {
    return NextResponse.json({ error: 'فشل في البحث' }, { status: 500 });
  }
}
