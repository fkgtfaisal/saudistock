import { NextRequest, NextResponse } from "next/server";
import YahooFinanceClass from "yahoo-finance2";
import { SAUDI_STOCKS } from "@/lib/stocks";

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

export async function GET(_req: NextRequest) {
  const cacheKey = "market:saudi";
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });

  try {
    const results = await Promise.allSettled(
      SAUDI_STOCKS.map((info) =>
        yahooFinance.quote(info.yahooTicker, {}, { validateResult: false })
      )
    );

    const stocks = results.map((result, idx) => {
      const info = SAUDI_STOCKS[idx];
      if (result.status === "rejected" || !result.value) {
        return { symbol: info.symbol, nameAr: info.nameAr, nameEn: info.nameEn, sector: info.sector, price: null, previousClose: null, change: null, changePercent: null, volume: null, marketCap: null, isUp: false, marketState: "CLOSED", currency: "SAR", error: true };
      }
      const q = result.value;
      const changePercent = q.regularMarketChangePercent ?? 0;
      return {
        symbol: info.symbol,
        nameAr: info.nameAr,
        nameEn: info.nameEn,
        sector: info.sector,
        price: q.regularMarketPrice ?? null,
        previousClose: q.regularMarketPreviousClose ?? null,
        change: q.regularMarketChange ?? null,
        changePercent,
        volume: q.regularMarketVolume ?? null,
        marketCap: q.marketCap ?? null,
        isUp: changePercent >= 0,
        marketState: q.marketState ?? "CLOSED",
        currency: q.currency ?? "SAR",
        error: false,
      };
    });

    const valid = stocks.filter((s) => !s.error);
    const advancing = valid.filter((s) => s.isUp).length;
    const declining = valid.filter((s) => !s.isUp).length;

    // TASI index
    let tasiData = null;
    try {
      const tasi = await yahooFinance.quote("^TASI.SR", {}, { validateResult: false });
      if (tasi) {
        tasiData = {
          price: tasi.regularMarketPrice ?? null,
          change: tasi.regularMarketChange ?? null,
          changePercent: tasi.regularMarketChangePercent ?? null,
          isUp: (tasi.regularMarketChangePercent ?? 0) >= 0,
          marketState: tasi.marketState ?? "CLOSED",
        };
      }
    } catch (e) {
      console.warn("[market API] TASI fetch failed:", e);
    }

    const response = {
      stocks,
      summary: { advancing, declining, total: valid.length },
      tasi: tasiData,
      updatedAt: new Date().toISOString(),
    };

    setCache(cacheKey, response);
    return NextResponse.json(response);
  } catch (error) {
    console.error("[market API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch market data" }, { status: 502 });
  }
}
