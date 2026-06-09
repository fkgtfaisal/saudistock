/**
 * Client-side hooks for fetching stock data from our internal API routes.
 * These routes proxy Yahoo Finance and add server-side caching.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface StockQuote {
  symbol: string;
  ticker: string;
  price: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  marketCap: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  trailingPE: number | null;
  forwardPE: number | null;
  eps: number | null;
  dividendYield: number | null;
  beta: number | null;
  shortName: string | null;
  currency: string;
  marketState: string;
}

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketStock {
  symbol: string;
  nameAr: string;
  nameEn: string;
  sector: string;
  price: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  volume: number | null;
  marketCap: number | null;
  isUp: boolean;
  marketState: string;
  currency: string;
  error: boolean;
}

export interface MarketData {
  stocks: MarketStock[];
  summary: { advancing: number; declining: number; total: number };
  tasi: {
    price: number | null;
    change: number | null;
    changePercent: number | null;
    isUp: boolean;
    marketState: string;
  } | null;
  updatedAt: string;
}

export interface StockTrade {
  id: string;
  time: string;
  type: "buy" | "sell";
  price: number;
  quantity: number;
  value: number;
  high: number;
  low: number;
  change: number;
}

export interface StockTradesData {
  symbol: string;
  ticker: string;
  trades: StockTrade[];
  summary: {
    buyCount: number;
    sellCount: number;
    buyVolume: number;
    sellVolume: number;
    buyValue: number;
    sellValue: number;
    totalVolume: number;
    totalValue: number;
  };
  source: string;
  updatedAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Format a large number (e.g. marketCap) to a readable string */
export function formatMarketCap(value: number | null): string {
  if (value == null) return "—";
  if (value >= 1e12) return (value / 1e12).toFixed(2) + "T";
  if (value >= 1e9)  return (value / 1e9).toFixed(1) + "B";
  if (value >= 1e6)  return (value / 1e6).toFixed(1) + "M";
  return value.toLocaleString();
}

export function formatVolume(value: number | null): string {
  if (value == null) return "—";
  if (value >= 1e6) return (value / 1e6).toFixed(1) + "M";
  if (value >= 1e3) return (value / 1e3).toFixed(0) + "K";
  return value.toString();
}

export function formatPrice(value: number | null, decimals = 2): string {
  if (value == null) return "—";
  return value.toFixed(decimals);
}

export function formatPercent(value: number | null): string {
  if (value == null) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatChange(value: number | null): string {
  if (value == null) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

// ── API fetch functions ────────────────────────────────────────────────────

export async function fetchQuote(symbol: string): Promise<StockQuote> {
  const res = await fetch(`/api/quote/${symbol}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Failed to fetch quote for ${symbol}`);
  return res.json();
}

export async function fetchChart(symbol: string, timeframe = "1Y"): Promise<CandleData[]> {
  const res = await fetch(`/api/chart/${symbol}?timeframe=${timeframe}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Failed to fetch chart for ${symbol}`);
  return res.json();
}

export async function fetchMarket(): Promise<MarketData> {
  const res = await fetch("/api/market", { next: { revalidate: 60 } });
  if (!res.ok) throw new Error("Failed to fetch market data");
  return res.json();
}

export async function fetchSummary(symbol: string): Promise<any> {
  const res = await fetch(`/api/summary/${symbol}`, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`Failed to fetch summary for ${symbol}`);
  return res.json();
}

export async function fetchNews(symbol: string): Promise<any[]> {
  const res = await fetch(`/api/news/${symbol}`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Failed to fetch news for ${symbol}`);
  return res.json();
}

export async function fetchTrades(symbol: string): Promise<StockTradesData> {
  const res = await fetch(`/api/trades/${symbol}?limit=50`, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`Failed to fetch trades for ${symbol}`);
  return res.json();
}

/** Format a SAR number with abbreviation */
export function formatSAR(value: number | null | undefined): string {
  if (value == null) return "—";
  const abs = Math.abs(value);
  if (abs >= 1e9)  return (value / 1e9).toFixed(1) + " مليار";
  if (abs >= 1e6)  return (value / 1e6).toFixed(1) + " مليون";
  if (abs >= 1e3)  return (value / 1e3).toFixed(1) + " ألف";
  return value.toFixed(0);
}
