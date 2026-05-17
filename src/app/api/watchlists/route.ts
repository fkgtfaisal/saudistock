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
    const watchlists = await prisma.watchlist.findMany({
      where: { userId },
      include: {
        items: {
          orderBy: { addedAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'asc' }
    })
    
    return NextResponse.json(watchlists)
  } catch (error) {
    console.error('Watchlist GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch watchlists' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const { name } = await request.json()
    
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const watchlist = await prisma.watchlist.create({
      data: {
        name,
        userId
      },
      include: { items: true }
    })
    
    return NextResponse.json(watchlist)
  } catch (error) {
    console.error('Watchlist POST Error:', error)
    return NextResponse.json({ error: 'Failed to create watchlist' }, { status: 500 })
  }
}
