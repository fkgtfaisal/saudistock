import { NextRequest, NextResponse } from "next/server";
import YahooFinanceClass from "yahoo-finance2";
import { toYahooTicker } from "@/lib/stocks";

// yahoo-finance2 v3+ requires instantiation via `new`
const YF = (YahooFinanceClass as any).default ?? YahooFinanceClass;
const yahooFinance = new YF({ suppressNotices: ["yahooSurvey"] });

const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000;

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.data as T;
}
function setCache(key: string, data: unknown) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const ticker = toYahooTicker(symbol);
  const cacheKey = `quote:${ticker}`;

  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });

  try {
    const quote = await yahooFinance.quote(ticker, {}, { validateResult: false });

    const result = {
      symbol,
      ticker,
      price: quote.regularMarketPrice ?? null,
      previousClose: quote.regularMarketPreviousClose ?? null,
      change: quote.regularMarketChange ?? null,
      changePercent: quote.regularMarketChangePercent ?? null,
      open: quote.regularMarketOpen ?? null,
      high: quote.regularMarketDayHigh ?? null,
      low: quote.regularMarketDayLow ?? null,
      volume: quote.regularMarketVolume ?? null,
      marketCap: quote.marketCap ?? null,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow ?? null,
      trailingPE: quote.trailingPE ?? null,
      forwardPE: quote.forwardPE ?? null,
      eps: quote.epsTrailingTwelveMonths ?? null,
      dividendYield: quote.trailingAnnualDividendYield ?? null,
      beta: quote.beta ?? null,
      shortName: quote.shortName ?? null,
      currency: quote.currency ?? "SAR",
      marketState: quote.marketState ?? "CLOSED",
    };

    setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`[quote API] Error for ${ticker}:`, error);
    return NextResponse.json({ error: "Failed to fetch quote", symbol, ticker }, { status: 502 });
  }
}
