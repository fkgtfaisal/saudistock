import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import YahooFinanceClass from 'yahoo-finance2'

const YF = (YahooFinanceClass as any).default ?? YahooFinanceClass
const yahooFinance = new YF({ suppressNotices: ['yahooSurvey'] })

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const { symbol, type, quantity: rawQuantity } = await request.json()
    const quantity = parseFloat(rawQuantity)

    if (!symbol || !type || isNaN(quantity) || quantity <= 0) {
      return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 })
    }

    if (type !== 'BUY' && type !== 'SELL') {
      return NextResponse.json({ error: 'Invalid order type' }, { status: 400 })
    }

    // 1. Fetch live stock price to ensure secure execution price
    const ticker = symbol.endsWith('.SR') ? symbol : `${symbol}.SR`
    let executionPrice = 0
    try {
      const quote = await yahooFinance.quote(ticker, {}, { validateResult: false })
      if (!quote || quote.regularMarketPrice === undefined) {
        return NextResponse.json({ error: 'Failed to fetch live price for execution' }, { status: 400 })
      }
      executionPrice = quote.regularMarketPrice
    } catch (e) {
      return NextResponse.json({ error: 'Stock symbol not found or price fetch failed' }, { status: 400 })
    }

    const totalCost = quantity * executionPrice

    // 2. Perform Transaction
    await prisma.$transaction(async (tx) => {
      // Get user
      const user = await tx.user.findUnique({
        where: { id: userId }
      })

      if (!user) throw new Error('User not found')

      // Get portfolio
      let portfolio = await tx.portfolio.findFirst({
        where: { userId }
      })

      if (!portfolio) {
        portfolio = await tx.portfolio.create({
          data: {
            userId,
            name: 'المحفظة الرئيسية'
          }
        })
      }

      // Check existing holdings
      const existingHolding = await tx.portfolioItem.findFirst({
        where: {
          portfolioId: portfolio.id,
          symbol
        }
      })

      if (type === 'BUY') {
        if (user.balance < totalCost) {
          throw new Error('INSUFFICIENT_FUNDS')
        }

        // Deduct balance
        await tx.user.update({
          where: { id: userId },
          data: {
            balance: {
              decrement: totalCost
            }
          }
        })

        if (existingHolding) {
          const newQty = existingHolding.quantity + quantity
          const newAvgPrice = ((existingHolding.quantity * existingHolding.averagePrice) + (quantity * executionPrice)) / newQty
          
          await tx.portfolioItem.update({
            where: { id: existingHolding.id },
            data: {
              quantity: newQty,
              averagePrice: newAvgPrice
            }
          })
        } else {
          await tx.portfolioItem.create({
            data: {
              portfolioId: portfolio.id,
              symbol,
              quantity,
              averagePrice: executionPrice
            }
          })
        }
      } else {
        // SELL
        if (!existingHolding || existingHolding.quantity < quantity) {
          throw new Error('INSUFFICIENT_HOLDINGS')
        }

        // Add to balance
        await tx.user.update({
          where: { id: userId },
          data: {
            balance: {
              increment: totalCost
            }
          }
        })

        if (existingHolding.quantity === quantity) {
          // Sell all
          await tx.portfolioItem.delete({
            where: { id: existingHolding.id }
          })
        } else {
          // Sell part
          await tx.portfolioItem.update({
            where: { id: existingHolding.id },
            data: {
              quantity: {
                decrement: quantity
              }
            }
          })
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: type === 'BUY' ? 'تمت عملية الشراء بنجاح' : 'تمت عملية البيع بنجاح',
      executionPrice,
      totalCost
    })
  } catch (error: any) {
    console.error('Trade Execution Error:', error)
    if (error.message === 'INSUFFICIENT_FUNDS') {
      return NextResponse.json({ error: 'الرصيد النقدي غير كافٍ لإتمام هذه الصفقة' }, { status: 400 })
    }
    if (error.message === 'INSUFFICIENT_HOLDINGS') {
      return NextResponse.json({ error: 'الأسهم المملوكة غير كافية لإتمام هذه الصفقة' }, { status: 400 })
    }
    return NextResponse.json({ error: 'فشلت عملية التداول الفورية' }, { status: 500 })
  }
}
