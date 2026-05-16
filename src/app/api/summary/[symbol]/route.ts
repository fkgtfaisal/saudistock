import { NextRequest, NextResponse } from "next/server";
import YahooFinanceClass from "yahoo-finance2";
import { toYahooTicker } from "@/lib/stocks";

const YF = (YahooFinanceClass as any).default ?? YahooFinanceClass;
const yahooFinance = new YF({ suppressNotices: ["yahooSurvey"] });

const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

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
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const { searchParams } = new URL(req.url);
  const refresh = searchParams.get("refresh") === "true";

  const ticker = toYahooTicker(symbol);
  const cacheKey = `summary:${ticker}`;

  if (refresh) {
    cache.delete(cacheKey);
  }

  const cached = getCached(cacheKey);
  if (cached && !refresh) return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });

  try {
    console.log(`[summary API] Fetching data for ticker: ${ticker}`);
    
    // Use a timeout to prevent hanging the server
    const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms));

    const fetchData = async () => {
      const [summary, fundamentalsA, fundamentalsQ] = await Promise.all([
        yahooFinance.quoteSummary(ticker, {
          modules: [
            "recommendationTrend",
            "earningsTrend",
            "upgradeDowngradeHistory",
            "assetProfile",
            "defaultKeyStatistics",
            "financialData",
          ],
        }, { validateResult: false }),
        
        yahooFinance.fundamentalsTimeSeries(ticker, {
          module: "all",
          type: "annual",
          period1: "2020-01-01",
        }, { validateResult: false }).catch(() => []),
        
        yahooFinance.fundamentalsTimeSeries(ticker, {
          module: "all",
          type: "quarterly",
          period1: "2022-01-01",
        }, { validateResult: false }).catch(() => [])
      ]);
      return { summary, fundamentalsA, fundamentalsQ };
    };

    const data: any = await Promise.race([fetchData(), timeout(15000)]);
    const { summary, fundamentalsA, fundamentalsQ } = data;

    console.log(`[summary API] Successfully fetched data for ${ticker}`);

    const mapToFmt = (fund: any) => {
      if (!fund || !fund.date) return null;
      const dateStr = fund.date instanceof Date ? fund.date.toISOString() : String(fund.date);
      const obj: any = { endDate: { fmt: dateStr.split("T")[0] } };
      for (const [key, val] of Object.entries(fund)) {
        if (typeof val === "number") {
          obj[key] = { raw: val };
        }
      }
      // Add aliases for common fields used in frontend
      if (fund.pretaxIncome != null) obj.incomeBeforeTax = { raw: fund.pretaxIncome };
      if (fund.taxProvision != null) obj.incomeTaxExpense = { raw: fund.taxProvision };
      if (fund.currentAssets != null) obj.totalCurrentAssets = { raw: fund.currentAssets };
      if (fund.totalLiabilitiesNetMinorityInterest != null) obj.totalLiab = { raw: fund.totalLiabilitiesNetMinorityInterest };
      if (fund.currentLiabilities != null) obj.totalCurrentLiabilities = { raw: fund.currentLiabilities };
      if (fund.stockholdersEquity != null) obj.totalStockholderEquity = { raw: fund.stockholdersEquity };
      if (fund.cashCashEquivalentsAndShortTermInvestments != null) obj.cash = { raw: fund.cashCashEquivalentsAndShortTermInvestments };
      if (fund.operatingCashFlow != null) obj.totalCashFromOperatingActivities = { raw: fund.operatingCashFlow };
      if (fund.investingCashFlow != null) obj.totalCashflowsFromInvestingActivities = { raw: fund.investingCashFlow };
      if (fund.financingCashFlow != null) obj.totalCashFromFinancingActivities = { raw: fund.financingCashFlow };
      if (fund.capitalExpenditure != null) obj.capitalExpenditures = { raw: fund.capitalExpenditure };
      if (fund.EBIT != null) obj.ebit = { raw: fund.EBIT };
      
      return obj;
    };

    const processSet = (set: any[]) => 
      (set || [])
        .map(mapToFmt)
        .filter(Boolean)
        .sort((a, b) => new Date(b.endDate.fmt).getTime() - new Date(a.endDate.fmt).getTime());

    const result = {
      income: processSet(fundamentalsA),
      balance: processSet(fundamentalsA),
      cashflow: processSet(fundamentalsA),
      incomeQ: processSet(fundamentalsQ),
      balanceQ: processSet(fundamentalsQ),
      cashflowQ: processSet(fundamentalsQ),
      recommendations: summary.recommendationTrend?.trend ?? [],
      earningsTrend: summary.earningsTrend?.trend ?? [],
      upgrades: summary.upgradeDowngradeHistory?.history?.slice(0, 10) ?? [],
      profile: summary.assetProfile ?? null,
      keyStats: summary.defaultKeyStatistics ?? null,
      financialData: summary.financialData ?? null,
    };

    setCache(cacheKey, result);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error(`[summary API] Error for ${ticker}:`, error.message);
    return NextResponse.json({ 
      error: "Failed to fetch summary", 
      message: error.message,
      symbol, 
      ticker 
    }, { status: 500 });
  }
}
