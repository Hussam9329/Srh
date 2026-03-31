import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT /api/installments/[id] - Update installment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const installmentId = parseInt(id, 10)

    if (isNaN(installmentId)) {
      return NextResponse.json({ error: 'Invalid installment ID' }, { status: 400 })
    }

    const body = await request.json()
    const { amount, notes, installmentType, paymentDate } = body

    const installment = await db.installment.update({
      where: { id: installmentId },
      data: {
        ...(amount !== undefined ? { amount: parseFloat(amount) } : {}),
        ...(notes !== undefined ? { notes: notes || null } : {}),
        ...(installmentType !== undefined ? { installmentType } : {}),
        ...(paymentDate !== undefined ? { paymentDate: new Date(paymentDate) } : {}),
      },
    })

    return NextResponse.json(installment)
  } catch (error: any) {
    console.error('Error updating installment:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Installment not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update installment' },
      { status: 500 }
    )
  }
}

// DELETE /api/installments/[id] - Delete installment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const installmentId = parseInt(id, 10)

    if (isNaN(installmentId)) {
      return NextResponse.json({ error: 'Invalid installment ID' }, { status: 400 })
    }

    await db.installment.delete({
      where: { id: installmentId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting installment:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Installment not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to delete installment' },
      { status: 500 }
    )
  }
}
