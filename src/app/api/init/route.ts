import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST() {
  try {
    const existing = await db.instituteBalance.findFirst();
    if (!existing) {
      await db.instituteBalance.create({
        data: { totalIncome: 0, totalWithdrawn: 0 }
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'فشل في التهيئة' }, { status: 500 });
  }
}
