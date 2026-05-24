import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import yahooFinance from "yahoo-finance2";
import { getBadges } from "@/lib/badges";

const INITIAL_BALANCE = 100000;

export async function GET() {
  try {
    // Fetch all users with their portfolios and items
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        balance: true,
        portfolios: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!users || users.length === 0) {
      return NextResponse.json([]);
    }

    // 2. Gather all unique symbols across all users' portfolios
    const allSymbols = new Set<string>();
    users.forEach((user) => {
      user.portfolios.forEach((portfolio) => {
        portfolio.items.forEach((item) => {
          allSymbols.add(item.symbol);
        });
      });
    });

    // 3. Fetch live market prices for these symbols
    const symbolsArray = Array.from(allSymbols);
    let marketData: Record<string, number> = {};

    if (symbolsArray.length > 0) {
      const quotes = (await yahooFinance.quote(symbolsArray)) as any[];
      quotes.forEach((quote) => {
        marketData[quote.symbol] = quote.regularMarketPrice;
      });
    }

    // 4. Calculate Net Worth for each user
    const leaderboard = users.map((user) => {
      let totalPortfolioValue = 0;

      user.portfolios.forEach((portfolio) => {
        portfolio.items.forEach((item) => {
          const currentPrice = marketData[item.symbol] || item.averagePrice; // Fallback to average price if API fails
          totalPortfolioValue += currentPrice * item.quantity;
        });
      });

      const netWorth = user.balance + totalPortfolioValue;
      const returnPercent = ((netWorth - INITIAL_BALANCE) / INITIAL_BALANCE) * 100;
      const cashPercent = netWorth > 0 ? (user.balance / netWorth) * 100 : 0;
      const badges = getBadges(netWorth, returnPercent, cashPercent);

      return {
        id: user.id,
        name: user.name || "متداول مجهول",
        balance: user.balance,
        portfolioValue: totalPortfolioValue,
        netWorth: netWorth,
        returnPercent: returnPercent,
        badges: badges,
      };
    });

    // 5. Sort by netWorth descending
    leaderboard.sort((a, b) => b.netWorth - a.netWorth);

    // Return the top 100 traders
    return NextResponse.json(leaderboard.slice(0, 100));
  } catch (error) {
    console.error("Leaderboard Error:", error);
    return NextResponse.json(
      { error: "Failed to calculate leaderboard data" },
      { status: 500 }
    );
  }
}
