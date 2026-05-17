"use client";

import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, Search, LineChart, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import {
  fetchMarket,
  type MarketData,
  type MarketStock,
  formatPrice,
  formatChange,
  formatPercent,
  formatVolume,
  formatMarketCap,
} from "@/lib/market-api";

const sectors = ["الكل", "البنوك", "الطاقة", "المواد الأساسية", "الاتصالات", "التجزئة", "إنتاج الأغذية", "النقل", "إنتاج الأسمنت", "التأمين", "العقارات"];

function SkeletonRow() {
  const widths = ["75%", "85%", "65%", "90%", "70%", "80%", "60%", "95%"];
  return (
    <tr className="border-b border-border">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="p-4">
          <div className="h-4 bg-muted/50 rounded animate-pulse" style={{ width: widths[i % widths.length] }} />
        </td>
      ))}
    </tr>
  );
}

function TasiCard({ tasi }: { tasi: MarketData["tasi"] }) {
  if (!tasi) return (
    <div className="bg-card border border-border p-6 rounded-xl">
      <h3 className="text-muted-foreground text-sm font-medium mb-1">المؤشر العام (TASI)</h3>
      <p className="text-2xl font-bold animate-pulse bg-muted/40 rounded h-8 w-32" />
    </div>
  );
  return (
    <div className="bg-card border border-border p-6 rounded-xl">
      <h3 className="text-muted-foreground text-sm font-medium mb-1">المؤشر العام (TASI)</h3>
      <p className="text-2xl font-bold" dir="ltr">{formatPrice(tasi.price, 2)}</p>
      <p className={`text-sm font-bold mt-1 ${tasi.isUp ? "text-success" : "text-destructive"}`} dir="ltr">
        {formatChange(tasi.change)} ({formatPercent(tasi.changePercent)})
      </p>
    </div>
  );
}

export default function MarketSaudiPage() {
  const [data, setData]         = useState<MarketData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery]   = useState("");
  const [activeSector, setActiveSector] = useState("الكل");

  const load = useCallback(async () => {
    try {
      setError(null);
      const market = await fetchMarket();
      setData(market);
      setLastUpdate(new Date());
    } catch (e) {
      setError("فشل تحميل بيانات السوق. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  const stocks: MarketStock[] = data?.stocks ?? [];

  const filteredStocks = stocks.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      s.nameAr.includes(searchQuery) ||
      s.nameEn.toLowerCase().includes(q) ||
      s.symbol.includes(searchQuery) ||
      s.sector.includes(searchQuery);
    const matchesSector = activeSector === "الكل" || s.sector === activeSector;
    return matchesSearch && matchesSector;
  });

  const PAGE_SIZE = 20;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to first page when search or sector changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeSector]);

  const totalPages = Math.ceil(filteredStocks.length / PAGE_SIZE);
  const paginatedStocks = filteredStocks.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <h1 className="text-3xl font-bold">السوق السعودي (تداول)</h1>
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {error ? (
              <WifiOff className="h-3.5 w-3.5 text-destructive" />
            ) : (
              <Wifi className="h-3.5 w-3.5 text-success" />
            )}
            {lastUpdate
              ? `آخر تحديث: ${lastUpdate.toLocaleTimeString("ar-SA")}`
              : "جارٍ التحديث..."}
          </span>
          <button
            onClick={() => { setLoading(true); load(); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs font-bold transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </button>
          {data?.tasi && (
            <div className="flex items-center">
              {data.tasi.marketState === "REGULAR" ? (
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-500 border border-emerald-500/20 px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  السوق مفتوح
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-rose-500/15 text-rose-500 border border-rose-500/20 px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm">
                  <span className="inline-block h-2 w-2 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
                  السوق مغلق
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium flex items-center gap-2">
          <WifiOff className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Market Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <TasiCard tasi={data?.tasi ?? null} />
        <div className="bg-card border border-border p-6 rounded-xl">
          <h3 className="text-muted-foreground text-sm font-medium mb-1">الشركات المرتفعة</h3>
          <p className="text-2xl font-bold text-success">
            {loading ? <span className="animate-pulse">—</span> : data?.summary.advancing ?? "—"}
          </p>
        </div>
        <div className="bg-card border border-border p-6 rounded-xl">
          <h3 className="text-muted-foreground text-sm font-medium mb-1">الشركات المنخفضة</h3>
          <p className="text-2xl font-bold text-destructive">
            {loading ? <span className="animate-pulse">—</span> : data?.summary.declining ?? "—"}
          </p>
        </div>
        <div className="bg-card border border-border p-6 rounded-xl">
          <h3 className="text-muted-foreground text-sm font-medium mb-1">إجمالي الأسهم</h3>
          <p className="text-2xl font-bold">
            {loading ? <span className="animate-pulse">—</span> : data?.summary.total ?? "—"}
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="ابحث عن سهم بالاسم أو الرمز..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {sectors.map((sector) => (
              <button
                key={sector}
                onClick={() => setActiveSector(sector)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  activeSector === sector
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {sector}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stocks Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground">
              <tr>
                <th className="p-4 font-medium">الرمز</th>
                <th className="p-4 font-medium">اسم الشركة</th>
                <th className="p-4 font-medium">القطاع</th>
                <th className="p-4 font-medium" dir="ltr">السعر (ر.س)</th>
                <th className="p-4 font-medium" dir="ltr">التغيير</th>
                <th className="p-4 font-medium" dir="ltr">الحجم</th>
                <th className="p-4 font-medium" dir="ltr">القيمة السوقية</th>
                <th className="p-4 font-medium">الرسم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                : paginatedStocks.map((stock) => (
                    <tr key={stock.symbol} className="hover:bg-muted/10 transition-colors group">
                      <td className="p-4">
                        <Link
                          href={`/symbols/${stock.symbol}`}
                          className="font-mono font-bold text-primary hover:underline"
                        >
                          {stock.symbol}
                        </Link>
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/symbols/${stock.symbol}`}
                          className="font-bold hover:text-primary transition-colors"
                        >
                          {stock.nameAr}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">{stock.nameEn}</p>
                      </td>
                      <td className="p-4 text-muted-foreground text-xs">{stock.sector}</td>
                      <td className="p-4 font-bold" dir="ltr">
                        {stock.error ? (
                          <span className="text-muted-foreground text-xs">خطأ</span>
                        ) : (
                          formatPrice(stock.price)
                        )}
                      </td>
                      <td className="p-4" dir="ltr">
                        {!stock.error && (
                          <span
                            className={`inline-flex items-center gap-1 font-bold ${
                              stock.isUp ? "text-success" : "text-destructive"
                            }`}
                          >
                            {stock.isUp ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            {formatChange(stock.change)} ({formatPercent(stock.changePercent)})
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-muted-foreground" dir="ltr">
                        {formatVolume(stock.volume)}
                      </td>
                      <td className="p-4 text-muted-foreground" dir="ltr">
                        {formatMarketCap(stock.marketCap)}
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/chart/${stock.symbol}`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <LineChart className="h-3 w-3" />
                          رسم
                        </Link>
                      </td>
                    </tr>
                  ))}
              {!loading && filteredStocks.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-muted-foreground">
                    لا توجد نتائج للبحث &quot;{searchQuery}&quot;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-center gap-2 bg-muted/5">
            <button
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-bold disabled:opacity-30 hover:bg-muted transition-colors"
            >
              السابق
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                // Only show first, last, and pages around current
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => {
                        setCurrentPage(pageNum);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                        currentPage === pageNum
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === currentPage - 2 ||
                  pageNum === currentPage + 2
                ) {
                  return <span key={pageNum} className="text-muted-foreground text-xs px-1">...</span>;
                }
                return null;
              })}
            </div>
            <button
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-bold disabled:opacity-30 hover:bg-muted transition-colors"
            >
              التالي
            </button>
          </div>
        )}

        <div className="p-4 border-t border-border text-sm text-muted-foreground flex items-center justify-between">
          <span>
            عرض {paginatedStocks.length} من {filteredStocks.length} سهم (إجمالي {stocks.length})
          </span>
          <span className="text-xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse inline-block" />
            بيانات حية — Yahoo Finance (تداول .SR)
          </span>
        </div>
      </div>
    </div>
  );
}
