import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id
    const { id } = await params

    // Verify ownership before delete
    const alert = await prisma.alert.findUnique({
      where: { id }
    })

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    if (alert.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.alert.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Alert deleted successfully' })
  } catch (error) {
    console.error('Alert DELETE Error:', error)
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id
    const { id } = await params
    const { status } = await request.json()

    const alert = await prisma.alert.findUnique({
      where: { id }
    })

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    if (alert.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updated = await prisma.alert.update({
      where: { id },
      data: { status }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Alert PATCH Error:', error)
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
  }
}

