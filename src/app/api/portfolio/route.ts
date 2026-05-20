import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import YahooFinanceClass from 'yahoo-finance2'

const YF = (YahooFinanceClass as any).default ?? YahooFinanceClass
const yahooFinance = new YF({ suppressNotices: ['yahooSurvey'] })

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    // 1. Get user balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 2. Find or create default portfolio
    let portfolio = await prisma.portfolio.findFirst({
      where: { userId },
      include: { items: true }
    })

    if (!portfolio) {
      portfolio = await prisma.portfolio.create({
        data: {
          userId,
          name: 'المحفظة الرئيسية'
        },
        include: { items: true }
      })
    }

    // 3. Calculate live value of items if there are any
    const items = portfolio.items
    const liveItems = []
    let totalEquityValue = 0

    if (items.length > 0) {
      // Fetch prices for all symbols in portfolio
      const quotes = await Promise.allSettled(
        items.map(item => {
          const ticker = item.symbol.endsWith('.SR') ? item.symbol : `${item.symbol}.SR`
          return yahooFinance.quote(ticker, {}, { validateResult: false })
        })
      )

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const quoteResult = quotes[i]
        
        let currentPrice = item.averagePrice
        let nameAr = item.symbol
        
        if (quoteResult.status === 'fulfilled' && quoteResult.value) {
          currentPrice = quoteResult.value.regularMarketPrice ?? item.averagePrice
          nameAr = quoteResult.value.shortName ?? item.symbol
        }

        const totalCost = item.quantity * item.averagePrice
        const currentValue = item.quantity * currentPrice
        const profitLoss = currentValue - totalCost
        const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0

        totalEquityValue += currentValue

        liveItems.push({
          id: item.id,
          symbol: item.symbol,
          nameAr,
          quantity: item.quantity,
          averagePrice: item.averagePrice,
          currentPrice,
          totalCost,
          currentValue,
          profitLoss,
          profitLossPercent
        })
      }
    }

    const totalPortfolioValue = user.balance + totalEquityValue

    return NextResponse.json({
      portfolioId: portfolio.id,
      name: portfolio.name,
      cashBalance: user.balance,
      totalEquityValue,
      totalPortfolioValue,
      items: liveItems
    })
  } catch (error) {
    console.error('Portfolio GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 })
  }
}
