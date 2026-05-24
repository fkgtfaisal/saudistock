import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import TraderProfileClient from "./TraderProfileClient";
import yahooFinance from "yahoo-finance2";
import { Metadata } from "next";
import { getBadges } from "@/lib/badges";

export const metadata: Metadata = {
  title: "ملف المتداول | SaudiStock",
  description: "عرض الملف الشخصي للمتداولين والمحافظ",
};

export default async function TraderProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch target user and their portfolios
  const trader = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      balance: true,
      subscriptionTier: true,
      portfolios: {
        include: {
          items: true,
        },
      },
      _count: {
        select: {
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!trader) {
    notFound();
  }

  // Calculate stats
  const allSymbols = new Set<string>();
  trader.portfolios.forEach((portfolio) => {
    portfolio.items.forEach((item) => {
      allSymbols.add(item.symbol);
    });
  });

  const symbolsArray = Array.from(allSymbols);
  let marketData: Record<string, number> = {};

  if (symbolsArray.length > 0) {
    try {
      const quotes = (await yahooFinance.quote(symbolsArray)) as any[];
      quotes.forEach((quote) => {
        marketData[quote.symbol] = quote.regularMarketPrice;
      });
    } catch (e) {
      console.error("Failed to fetch yahoo finance data for trader profile:", e);
    }
  }

  let totalPortfolioValue = 0;
  const holdings: { symbol: string; value: number; percent: number }[] = [];

  trader.portfolios.forEach((portfolio) => {
    portfolio.items.forEach((item) => {
      const currentPrice = marketData[item.symbol] || item.averagePrice;
      const value = currentPrice * item.quantity;
      totalPortfolioValue += value;
      
      const existing = holdings.find((h) => h.symbol === item.symbol);
      if (existing) {
        existing.value += value;
      } else {
        holdings.push({ symbol: item.symbol, value, percent: 0 });
      }
    });
  });

  const INITIAL_BALANCE = 100000;
  const netWorth = trader.balance + totalPortfolioValue;
  const returnPercent = ((netWorth - INITIAL_BALANCE) / INITIAL_BALANCE) * 100;

  // Calculate percentages (ignoring cash, just equity allocation, or including cash?)
  // Let's calculate allocation percentage relative to total Net Worth
  holdings.forEach((h) => {
    h.percent = (h.value / netWorth) * 100;
  });

  const cashPercent = (trader.balance / netWorth) * 100;
  const badges = getBadges(netWorth, returnPercent, cashPercent);

  return (
    <div className="min-h-screen bg-background">
      <TraderProfileClient 
        trader={{
          id: trader.id,
          name: trader.name || "متداول مجهول",
          tier: trader.subscriptionTier,
          followersCount: trader._count.followers,
          followingCount: trader._count.following,
          returnPercent,
          holdings: holdings.sort((a, b) => b.percent - a.percent),
          cashPercent,
          badges,
        }}
      />
    </div>
  );
}
