import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const { symbol } = await request.json()
    const { id: watchlistId } = await params

    // Verify ownership
    const watchlist = await prisma.watchlist.findUnique({
      where: { id: watchlistId }
    })

    if (!watchlist || watchlist.userId !== userId) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 })
    }

    // Add item
    const item = await prisma.watchlistItem.create({
      data: {
        watchlistId,
        symbol
      }
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('WatchlistItem POST Error:', error)
    return NextResponse.json({ error: 'Failed to add item to watchlist' }, { status: 500 })
  }
}

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

    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const { id: watchlistId } = await params

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
    }

    // Verify ownership
    const watchlist = await prisma.watchlist.findUnique({
      where: { id: watchlistId }
    })

    if (!watchlist || watchlist.userId !== userId) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 })
    }

    await prisma.watchlistItem.delete({
      where: {
        watchlistId_symbol: {
          watchlistId,
          symbol
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('WatchlistItem DELETE Error:', error)
    return NextResponse.json({ error: 'Failed to remove item' }, { status: 500 })
  }
}
