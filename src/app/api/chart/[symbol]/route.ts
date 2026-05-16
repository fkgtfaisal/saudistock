import { NextRequest, NextResponse } from "next/server";
import YahooFinanceClass from "yahoo-finance2";
import { toYahooTicker } from "@/lib/stocks";

const YF = (YahooFinanceClass as any).default ?? YahooFinanceClass;
const yahooFinance = new YF({ suppressNotices: ["yahooSurvey"] });

const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.data as T;
}
function setCache(key: string, data: unknown) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

const INTERVAL_MAP: Record<string, { interval: "1d" | "1wk" | "1mo"; period1: string }> = {
  "1D":  { interval: "1d",  period1: daysAgo(1) },
  "1W":  { interval: "1d",  period1: daysAgo(7) },
  "1M":  { interval: "1d",  period1: daysAgo(30) },
  "3M":  { interval: "1d",  period1: daysAgo(90) },
  "6M":  { interval: "1d",  period1: daysAgo(180) },
  "1Y":  { interval: "1d",  period1: daysAgo(365) },
  "5Y":  { interval: "1wk", period1: daysAgo(365 * 5) },
  "ALL": { interval: "1mo", period1: "2010-01-01" },
};

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const timeframe = req.nextUrl.searchParams.get("timeframe") ?? "1Y";
  const ticker = toYahooTicker(symbol);
  const cacheKey = `chart:${ticker}:${timeframe}`;

  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });

  const config = INTERVAL_MAP[timeframe] ?? INTERVAL_MAP["1Y"];

  try {
    const result = await yahooFinance.chart(ticker, {
      period1: config.period1,
      interval: config.interval,
    }, { validateResult: false });

    const quotes = result.quotes ?? [];

    const data = quotes
      .filter((q: any) => q.open != null && q.high != null && q.low != null && q.close != null)
      .map((q: any) => ({
        time: new Date(q.date).toISOString().split("T")[0],
        open:   parseFloat(q.open.toFixed(2)),
        high:   parseFloat(q.high.toFixed(2)),
        low:    parseFloat(q.low.toFixed(2)),
        close:  parseFloat(q.close.toFixed(2)),
        volume: q.volume ?? 0,
      }));

    const dedupMap = new Map(data.map((d: any) => [d.time, d]));
    const finalData = Array.from(dedupMap.values()).sort((a: any, b: any) =>
      a.time.localeCompare(b.time)
    );

    setCache(cacheKey, finalData);
    return NextResponse.json(finalData);
  } catch (error) {
    console.error(`[chart API] Error for ${ticker} (${timeframe}):`, error);
    return NextResponse.json({ error: "Failed to fetch chart data", symbol, ticker }, { status: 502 });
  }
}
