import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const { symbol: rawSymbol } = await params
    const symbol = rawSymbol.toUpperCase()
    
    const layout = await prisma.chartLayout.findUnique({
      where: {
        userId_symbol: {
          userId,
          symbol
        }
      }
    })

    return NextResponse.json(layout || {})
  } catch (error) {
    console.error('ChartLayout GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch layout' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const { symbol: rawSymbol } = await params
    const symbol = rawSymbol.toUpperCase()
    const { layoutData, drawingsData } = await request.json()

    const layout = await prisma.chartLayout.upsert({
      where: {
        userId_symbol: {
          userId,
          symbol
        }
      },
      update: {
        layoutData: layoutData !== undefined ? layoutData : undefined,
        drawingsData: drawingsData !== undefined ? drawingsData : undefined,
      },
      create: {
        userId,
        symbol,
        layoutData,
        drawingsData
      }
    })

    return NextResponse.json(layout)
  } catch (error) {
    console.error('ChartLayout POST Error:', error)
    return NextResponse.json({ error: 'Failed to save layout' }, { status: 500 })
  }
}
