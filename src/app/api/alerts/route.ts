import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id
    
    const alerts = await prisma.alert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(alerts)
  } catch (error) {
    console.error('Alerts GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const { symbol, type, value } = await request.json()
    
    if (!symbol || !type || value === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const alert = await prisma.alert.create({
      data: {
        userId,
        symbol,
        type,
        value: parseFloat(value)
      }
    })
    
    return NextResponse.json(alert)
  } catch (error) {
    console.error('Alert POST Error:', error)
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
  }
}
