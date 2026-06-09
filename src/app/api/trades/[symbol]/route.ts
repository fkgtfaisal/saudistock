import { NextRequest, NextResponse } from "next/server";
import YahooFinanceClass from "yahoo-finance2";
import { toYahooTicker } from "@/lib/stocks";

const YF = (YahooFinanceClass as any).default ?? YahooFinanceClass;
const yahooFinance = new YF({ suppressNotices: ["yahooSurvey"] });

const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 30 * 1000;

type YahooIntradayQuote = {
  date: Date | string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
};

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

function formatTradeTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleTimeString("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Riyadh",
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const ticker = toYahooTicker(symbol);
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 40), 120);
  const cacheKey = `trades:${ticker}:${limit}`;

  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });

  try {
    const result = await yahooFinance.chart(
      ticker,
      {
        period1: new Date(Date.now() - 24 * 60 * 60 * 1000),
        interval: "1m" as any,
      },
      { validateResult: false }
    );

    const quotes = ((result.quotes ?? []) as YahooIntradayQuote[])
      .filter((q) => q.open != null && q.close != null && q.volume != null && q.volume > 0)
      .slice(-limit);

    const trades = quotes
      .map((q, index) => {
        const open = q.open ?? q.close ?? 0;
        const close = q.close ?? open;
        const high = q.high ?? Math.max(open, close);
        const low = q.low ?? Math.min(open, close);
        const volume = q.volume ?? 0;
        const type = close >= open ? "buy" : "sell";
        const price = Number(close.toFixed(2));
        const value = Number((price * volume).toFixed(2));

        return {
          id: `${symbol}-${new Date(q.date).getTime()}-${index}`,
          time: formatTradeTime(q.date),
          type,
          price,
          quantity: volume,
          value,
          high: Number(high.toFixed(2)),
          low: Number(low.toFixed(2)),
          change: Number((close - open).toFixed(2)),
        };
      })
      .reverse();

    const buyVolume = trades
      .filter((trade) => trade.type === "buy")
      .reduce((sum, trade) => sum + trade.quantity, 0);
    const sellVolume = trades
      .filter((trade) => trade.type === "sell")
      .reduce((sum, trade) => sum + trade.quantity, 0);
    const buyValue = trades
      .filter((trade) => trade.type === "buy")
      .reduce((sum, trade) => sum + trade.value, 0);
    const sellValue = trades
      .filter((trade) => trade.type === "sell")
      .reduce((sum, trade) => sum + trade.value, 0);

    const response = {
      symbol,
      ticker,
      trades,
      summary: {
        buyCount: trades.filter((trade) => trade.type === "buy").length,
        sellCount: trades.filter((trade) => trade.type === "sell").length,
        buyVolume,
        sellVolume,
        buyValue,
        sellValue,
        totalVolume: buyVolume + sellVolume,
        totalValue: buyValue + sellValue,
      },
      source: "estimated_intraday_bars",
      updatedAt: new Date().toISOString(),
    };

    setCache(cacheKey, response);
    return NextResponse.json(response);
  } catch (error) {
    console.error(`[trades API] Error for ${ticker}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch trades", symbol, ticker },
      { status: 502 }
    );
  }
}
