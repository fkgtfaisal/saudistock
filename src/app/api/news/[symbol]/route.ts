import { NextRequest, NextResponse } from "next/server";
import YahooFinanceClass from "yahoo-finance2";
import { toYahooTicker } from "@/lib/stocks";

const YF = (YahooFinanceClass as any).default ?? YahooFinanceClass;
const yahooFinance = new YF({ suppressNotices: ["yahooSurvey"] });

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const ticker = toYahooTicker(symbol);

  try {
    // Yahoo Finance news search
    const news = await yahooFinance.search(ticker, { newsCount: 10 });
    
    return NextResponse.json(news.news || []);
  } catch (error) {
    console.error(`[news API] Error for ${ticker}:`, error);
    return NextResponse.json({ error: "Failed to fetch news", symbol, ticker }, { status: 502 });
  }
}
