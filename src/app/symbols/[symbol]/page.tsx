"use client";

import { useState, use, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { useSession } from "next-auth/react";
import {
  ArrowUpRight, ArrowDownRight, Maximize2, Newspaper, Users, FileText,
  BarChart3, TrendingUp, Globe, MessageSquare, Calendar, Building2,
  Plus, X, Search, RefreshCw, Monitor, Laptop, Tablet, Smartphone, ChevronDown, Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChartComponent } from "@/components/ChartComponent";
import { FinancialsChartsSection } from "@/components/FinancialsChartsSection";
import {
  fetchQuote, fetchChart, fetchSummary, fetchNews, fetchTrades,
  type StockQuote, type CandleData, type StockTradesData,
  formatPrice, formatChange, formatPercent, formatVolume, formatMarketCap, formatSAR,
} from "@/lib/market-api";
import { STOCK_MAP, SAUDI_STOCKS } from "@/lib/stocks";

const TIMEFRAMES = ["1D","1W","1M","3M","6M","1Y","5Y","ALL"];

const defaultWatchlist = ["1120","2222","7010","2010","1010","1150","4030","2270","4190"];

const tabs = [
  { id: "overview",   label: "نظرة عامة" },
  { id: "financials", label: "القوائم المالية" },
  { id: "technicals", label: "تحليلات فنية" },
  { id: "forecasts",  label: "التوقعات" },
  { id: "news",       label: "أخبار السهم" },
  { id: "community",  label: "المجتمع" },
  { id: "profile",    label: "عن الشركة" },
];

function SkeletonBlock({ w = "w-32", h = "h-8" }: { w?: string; h?: string }) {
  return <div className={`${w} ${h} bg-muted/50 rounded animate-pulse`} />;
}

export default function SymbolPage({ params }: { params: Promise<{ symbol: string }> }) {
  const router = useRouter();
  const { symbol } = use(params);
  const info = STOCK_MAP[symbol];
  const { data: session } = useSession();

  const [quote, setQuote]           = useState<StockQuote | null>(null);
  const [chartData, setChartData]   = useState<CandleData[]>([]);
  const [summary, setSummary]       = useState<any>(null);
  const [timeframe, setTimeframe]   = useState("1Y");
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [news, setNews]             = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [tradesData, setTradesData] = useState<StockTradesData | null>(null);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [activeTab, setActiveTab]   = useState("overview");
  const [indicators, setIndicators] = useState<string[]>([]);
  const [watchlist, setWatchlist]   = useState<string[]>([]);
  const [watchlistId, setWatchlistId] = useState<string | null>(null);
  const [allWatchlists, setAllWatchlists] = useState<any[]>([]);
  const hasLoadedSettings = useRef(false);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [isCreatingListLoading, setIsCreatingListLoading] = useState(false);
  
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);
  const [showIndicatorDropdown, setShowIndicatorDropdown] = useState(false);
  const [symbolSearch, setSymbolSearch] = useState("");
  
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [viewport, setViewport] = useState<"auto" | "desktop" | "laptop" | "tablet" | "mobile_ip" | "mobile_sa">("auto");

  const prevMainPriceRef = useRef<number | null>(null);
  const [mainPriceFlash, setMainPriceFlash] = useState<"up" | "down" | null>(null);

  // Fetch quote
  const loadQuote = useCallback(async () => {
    try {
      if (!quote) setLoadingQuote(true);
      const q = await fetchQuote(symbol);
      if (q && q.price !== null) {
        if (prevMainPriceRef.current !== null && prevMainPriceRef.current !== q.price) {
          setMainPriceFlash(q.price > prevMainPriceRef.current ? "up" : "down");
          setTimeout(() => setMainPriceFlash(null), 1000);
        }
        prevMainPriceRef.current = q.price;
      }
      setQuote(q);
    } catch { /* keep previous data */ }
    finally { setLoadingQuote(false); }
  }, [symbol, quote]);

  // Fetch chart
  const loadChart = useCallback(async () => {
    try {
      setLoadingChart(true);
      const c = await fetchChart(symbol, timeframe);
      if (c.length > 0) setChartData(c);
    } catch { /* keep previous data */ }
    finally { setLoadingChart(false); }
  }, [symbol, timeframe]);

  const loadSummary = useCallback(async () => {
    if (summary) return; // already loaded
    try {
      setLoadingSummary(true);
      const s = await fetchSummary(symbol);
      setSummary(s);
    } catch { /* ignore */ }
    finally { setLoadingSummary(false); }
  }, [symbol, summary]);

  const loadNews = useCallback(async () => {
    if (news.length > 0) return;
    try {
      setLoadingNews(true);
      const n = await fetchNews(symbol);
      setNews(n);
    } catch { /* ignore */ }
    finally { setLoadingNews(false); }
  }, [symbol, news.length]);

  const loadTrades = useCallback(async () => {
    try {
      setLoadingTrades(true);
      const data = await fetchTrades(symbol);
      setTradesData(data);
    } catch {
      // Keep the previous tape if the intraday feed is temporarily unavailable.
    } finally {
      setLoadingTrades(false);
    }
  }, [symbol]);

  useEffect(() => { loadQuote(); }, [loadQuote]);
  useEffect(() => { loadChart(); }, [loadChart]);
  useEffect(() => { loadTrades(); }, [loadTrades]);

  // Load saved layout settings (timeframe and indicators)
  useEffect(() => {
    hasLoadedSettings.current = false;
    
    if (!session?.user) {
      hasLoadedSettings.current = true;
      return;
    }
    
    const fetchLayout = async () => {
      try {
        const res = await fetch(`/api/charts/${symbol}`);
        if (res.ok) {
          const layout = await res.json();
          if (layout && layout.layoutData) {
            const layoutData = typeof layout.layoutData === 'string' ? JSON.parse(layout.layoutData) : layout.layoutData;
            if (layoutData.timeframe) setTimeframe(layoutData.timeframe);
            if (Array.isArray(layoutData.indicators)) setIndicators(layoutData.indicators);
          }
        }
      } catch (e) {
        console.error("Failed to load saved layout settings", e);
      } finally {
        hasLoadedSettings.current = true;
      }
    };
    fetchLayout();
  }, [symbol, session]);

  // Save layout settings when timeframe or indicators change
  useEffect(() => {
    if (!hasLoadedSettings.current || !session?.user) return;
    
    const saveLayout = async () => {
      try {
        await fetch(`/api/charts/${symbol}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            layoutData: {
              timeframe: timeframe,
              indicators: indicators
            }
          })
        });
      } catch (e) {
        console.error("Failed to save layout settings", e);
      }
    };
    
    const timer = setTimeout(saveLayout, 1000);
    return () => clearTimeout(timer);
  }, [timeframe, indicators, symbol, session]);

  // Lazy-load summary when user opens a tab that needs it
  useEffect(() => {
    if (["financials", "technicals", "forecasts", "profile"].includes(activeTab)) {
      loadSummary();
    }
    if (activeTab === "news") {
      loadNews();
    }
  }, [activeTab, loadSummary, loadNews]);

  // Auto-refresh quote: 5s when market is open, 30s when closed for live real-time feel
  useEffect(() => {
    const isMarketOpen = quote?.marketState === "REGULAR";
    const intervalTime = isMarketOpen ? 5000 : 30000;
    const id = setInterval(loadQuote, intervalTime);
    return () => clearInterval(id);
  }, [loadQuote, quote?.marketState]);

  useEffect(() => {
    const id = setInterval(loadTrades, 30000);
    return () => clearInterval(id);
  }, [loadTrades]);

  // --- Watchlist Persistence ---
  const [isWatchlistLoaded, setIsWatchlistLoaded] = useState(false);

  useEffect(() => {
    async function fetchWatchlist() {
      if (!session?.user) {
        // Fallback to local storage if not logged in
        if (typeof window !== "undefined") {
          const saved = localStorage.getItem("tadawul_terminal_watchlist");
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setWatchlist(parsed);
              } else {
                setWatchlist(defaultWatchlist);
              }
            } catch (e) {
              setWatchlist(defaultWatchlist);
            }
          } else {
            setWatchlist(defaultWatchlist);
          }
          setIsWatchlistLoaded(true);
        }
        return;
      }

      try {
        const res = await fetch('/api/watchlists');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        
        if (data && data.length > 0) {
          setAllWatchlists(data);
          const selected = data.find((w: any) => w.id === watchlistId) || data[0];
          setWatchlistId(selected.id);
          setWatchlist(selected.items.map((item: any) => item.symbol));
        } else {
          const createRes = await fetch('/api/watchlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'قائمة المراقبة الرئيسية' })
          });
          const newList = await createRes.json();
          setAllWatchlists([{ ...newList, items: [] }]);
          setWatchlistId(newList.id);
          setWatchlist([]);
        }
      } catch (e) {
        console.error("Watchlist fetch error:", e);
      } finally {
        setIsWatchlistLoaded(true);
      }
    }
    
    if (session !== undefined) {
      fetchWatchlist();
    }
  }, [session]);

  const toggleWatchlist = async (sym: string) => {
    const inWatchlist = watchlist.includes(sym);
    
    // Optimistic UI update
    if (inWatchlist) {
      setWatchlist((w) => w.filter((x) => x !== sym));
      setAllWatchlists(all => all.map(w => w.id === watchlistId ? { ...w, items: w.items.filter((i: any) => i.symbol !== sym) } : w));
    } else {
      setWatchlist((w) => [...w, sym]);
      setAllWatchlists(all => all.map(w => w.id === watchlistId ? { ...w, items: [...w.items, { symbol: sym }] } : w));
    }

    if (!session?.user) {
      // Save to local storage
      const newW = inWatchlist ? watchlist.filter((x) => x !== sym) : [...watchlist, sym];
      localStorage.setItem("tadawul_terminal_watchlist", JSON.stringify(newW));
      return;
    }

    if (!watchlistId) return;

    try {
      if (inWatchlist) {
        await fetch(`/api/watchlists/${watchlistId}/items?symbol=${sym}`, { method: 'DELETE' });
      } else {
        await fetch(`/api/watchlists/${watchlistId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: sym })
        });
      }
    } catch (error) {
      console.error("Failed to update watchlist", error);
    }
  };

  const handleWatchlistChange = (id: string) => {
    setWatchlistId(id);
    const selected = allWatchlists.find(w => w.id === id);
    if (selected) {
      setWatchlist(selected.items.map((item: any) => item.symbol));
    }
  };

  const createNewWatchlist = async () => {
    if (!newListName.trim() || !session?.user) return;
    try {
      setIsCreatingListLoading(true);
      const res = await fetch('/api/watchlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newListName.trim() })
      });
      if (!res.ok) throw new Error("Failed to create list");
      const newList = await res.json();
      setAllWatchlists(all => [...all, { ...newList, items: [] }]);
      setWatchlistId(newList.id);
      setWatchlist([]);
      setIsCreatingList(false);
      setNewListName("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreatingListLoading(false);
    }
  };
  // -----------------------------

  const toggleIndicator = (ind: string) =>
    setIndicators((prev) => prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind]);

  const isUp = (quote?.changePercent ?? 0) >= 0;
  const nameAr = info?.nameAr ?? `سهم ${symbol}`;
  const sector = info?.sector ?? "عام";

  // Dynamic width class based on viewport setting
  const widthClass = viewport === "auto" ? "w-full max-w-[2560px] px-4 sm:px-6 lg:px-8 xl:px-12" : "container mx-auto px-4";

  return (
    <div className={`flex flex-col min-h-screen transition-all duration-500 mx-auto bg-background ${
      viewport === "desktop" ? "max-w-[1440px] shadow-2xl ring-1 ring-border mt-4 mb-4 rounded-2xl overflow-hidden" :
      viewport === "laptop" ? "max-w-[1024px] shadow-2xl ring-1 ring-border mt-4 mb-4 rounded-2xl overflow-hidden" :
      viewport === "tablet" ? "max-w-[768px] shadow-2xl ring-1 ring-border mt-4 mb-4 rounded-2xl overflow-hidden" :
      viewport === "mobile_ip" ? "max-w-[390px] shadow-2xl ring-1 ring-border mt-4 mb-4 rounded-2xl overflow-hidden" :
      viewport === "mobile_sa" ? "max-w-[360px] shadow-2xl ring-1 ring-border mt-4 mb-4 rounded-2xl overflow-hidden" :
      "max-w-full"
    }`}>
      {/* Header Section */}
      <div className="border-b border-border bg-card shadow-sm">
        <div className={`${widthClass} py-3 sm:py-5`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary/30 to-primary/10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black truncate leading-tight">{nameAr}</h1>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground font-medium mt-0.5">
                  <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" /> تداول الرئيسي</span>
                  <span className="opacity-30">•</span>
                  <span className="font-bold text-foreground">{symbol}</span>
                  <span className="opacity-30">•</span>
                  <span className="truncate">{sector}</span>
                  {quote && (
                    <>
                      <span className="opacity-30">•</span>
                      {quote.marketState === "REGULAR" ? (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded font-bold text-[10px]">
                          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                          السوق مفتوح
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-rose-500/15 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded font-bold text-[10px]">
                          <span className="inline-block h-2 w-2 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
                          السوق مغلق
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-row items-center justify-between md:justify-end gap-4 sm:gap-8 bg-muted/20 md:bg-transparent p-3 sm:p-0 rounded-xl border border-border/40 md:border-none">
              {/* Price Action */}
              <div className="text-right flex-1 md:flex-none" dir="ltr">
                {loadingQuote ? (
                  <SkeletonBlock w="w-24 sm:w-36" h="h-8 sm:h-10" />
                ) : (
                  <>
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter transition-all duration-300 ${
                        mainPriceFlash === "up" ? "bg-emerald-500/25 text-emerald-400 scale-105 rounded px-2" :
                        mainPriceFlash === "down" ? "bg-rose-500/25 text-rose-400 scale-105 rounded px-2" : ""
                      }`}>
                        {formatPrice(quote?.price ?? null)}
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase">SAR</span>
                    </div>
                    <div className={`flex items-center justify-end gap-1 text-xs sm:text-sm font-bold ${isUp ? "text-success" : "text-destructive"}`}>
                      <span>{formatChange(quote?.change ?? null)}</span>
                      <span>({formatPercent(quote?.changePercent ?? null)})</span>
                      {isUp ? <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" /> : <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4" />}
                    </div>
                  </>
                )}
              </div>

              <div className="hidden md:block h-10 w-[1px] bg-border/50" />

              {/* Tools & Settings */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 bg-background p-1 rounded-lg border border-border shadow-sm">
                  <button 
                    onClick={() => setViewport("auto")}
                    className={`p-1.5 rounded-md transition-all ${viewport === "auto" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
                    title="تلقائي (كامل الشاشة)"
                  >
                    <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                  <button 
                    onClick={() => setViewport("desktop")}
                    className={`p-1.5 rounded-md transition-all ${viewport === "desktop" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
                    title="كمبيوتر"
                  >
                    <Monitor className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                  <button 
                    onClick={() => setViewport("mobile_ip")}
                    className={`p-1.5 rounded-md transition-all ${viewport === "mobile_ip" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
                    title="جوال"
                  >
                    <Smartphone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                </div>

                <button
                  onClick={() => { loadQuote(); loadChart(); }}
                  className="p-2 sm:p-2.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20 shadow-sm shadow-primary/5 active:scale-95"
                  title="تحديث البيانات"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingQuote ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Tabs Navigation */}
      <div className="border-b border-border bg-card/80 backdrop-blur-md sticky top-16 z-40">
        <div className={`${widthClass}`}>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-bold whitespace-nowrap transition-all rounded-t-xl relative group ${
                  activeTab === tab.id
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="tabUnderline" 
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" 
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Responsive Grid */}
      <div className="flex-1 overflow-x-hidden">
        <div className={`${widthClass} py-4 md:py-6`}>
          <div className="flex flex-col lg:flex-row-reverse gap-6">
            {/* Left Column: Chart + Insights */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Chart Component Wrapper */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm relative">
                <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-border bg-muted/10 gap-3 relative z-30">
                  {/* Timeframes Selector */}
                  <div className="flex items-center gap-1 bg-background p-1 rounded-lg border border-border/50">
                    {TIMEFRAMES.map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold transition-all ${
                          timeframe === tf ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>

                  {/* Right Header Tools */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Full Chart Link */}
                    <Link
                      href={`/chart/${symbol}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/10"
                    >
                      <Maximize2 className="h-3 w-3" />
                      <span className="hidden sm:inline">الشاشة الكاملة</span>
                    </Link>

                    {/* Indicator Dropdown */}
                    <div className="relative">
                      <button 
                        onClick={() => { setShowIndicatorDropdown(!showIndicatorDropdown); setShowSymbolDropdown(false); }}
                        className="px-3 py-1.5 bg-background border border-border rounded-lg text-[10px] sm:text-xs font-bold flex items-center gap-2 hover:border-primary transition-all shadow-sm"
                      >
                        <Plus className="h-3 w-3" />
                        المؤشرات
                        <ArrowDownRight className="h-3 w-3 opacity-50" />
                      </button>
                      {showIndicatorDropdown && (
                        <>
                          <div className="fixed inset-0 z-[90]" onClick={() => setShowIndicatorDropdown(false)} />
                          <div className="absolute top-full right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-2xl p-2 z-[100] animate-in fade-in zoom-in-95 duration-200">
                            <p className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border mb-1">قائمة المؤشرات</p>
                            {["SMA","EMA","BB","RSI","MACD"].map((ind) => (
                              <button
                                key={ind}
                                onClick={() => toggleIndicator(ind)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                  indicators.includes(ind) ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "text-muted-foreground hover:bg-muted"
                                }`}
                              >
                                <span>{ind}</span>
                                {indicators.includes(ind) ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Chart Engine - Vertically Optimized to fit screen */}
                {(() => {
                  // We use a viewport-relative height minus header/tabs space to keep everything on one screen
                  // Base height is roughly 100vh minus ~220px of UI overhead
                  return (
                    <div 
                      className="relative transition-all duration-500 ease-in-out min-h-[600px] h-[calc(100vh-220px)]" 
                    >
                      {loadingChart && chartData.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-sm">
                          <div className="flex flex-col items-center gap-4">
                            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                            <p className="text-sm font-bold text-muted-foreground">جاري تحميل بيانات الرسم البياني...</p>
                          </div>
                        </div>
                      ) : (
                        <ChartComponent data={chartData} symbol={symbol} indicators={indicators} />
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Tab Content Display */}
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                {activeTab === "overview"   && <OverviewTab symbol={symbol} quote={quote} nameAr={nameAr} sector={sector} loading={loadingQuote} />}
                {activeTab === "financials" && <FinancialsTab summary={summary} loading={loadingSummary} />}
                {activeTab === "technicals" && <TechnicalsTab summary={summary} quote={quote} chartData={chartData} loading={loadingSummary} />}
                {activeTab === "forecasts"  && <ForecastsTab summary={summary} loading={loadingSummary} />}
                {activeTab === "news"       && <NewsTab news={news} loading={loadingNews} />}
                {activeTab === "community"  && <CommunityTab symbol={symbol} nameAr={nameAr} />}
                {activeTab === "profile"    && <ProfileTab symbol={symbol} summary={summary} loading={loadingSummary} />}
              </div>
            </div>

            {/* Right Column: Analytics Sidebar */}
            <div className="w-full lg:w-80 shrink-0 space-y-6">
              {/* Watchlist Card */}
              <div className="flex flex-col border border-border bg-card rounded-2xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/10">
                  <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                    {session?.user && allWatchlists.length > 0 ? (
                      <div className="relative flex items-center group">
                        <select 
                          value={watchlistId || ""} 
                          onChange={(e) => handleWatchlistChange(e.target.value)}
                          className="bg-transparent text-xs font-black tracking-tight focus:outline-none appearance-none truncate cursor-pointer hover:text-primary transition-colors max-w-[120px] sm:max-w-[150px] pr-5"
                          title="اختر قائمة المراقبة"
                        >
                          {allWatchlists.map(w => (
                            <option key={w.id} value={w.id} className="bg-card text-foreground">{w.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="h-3 w-3 absolute right-0 pointer-events-none opacity-50 group-hover:opacity-100 group-hover:text-primary transition-all" />
                      </div>
                    ) : (
                      <span className="text-xs font-black tracking-tight truncate">قائمة المراقبة</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {session?.user && (
                      <button 
                        onClick={() => setIsCreatingList(!isCreatingList)}
                        className="p-1.5 rounded-lg bg-background border border-border hover:border-primary text-muted-foreground hover:text-primary transition-all active:scale-90"
                        title="إنشاء قائمة جديدة"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button 
                      onClick={() => setShowPicker(true)} 
                      className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all active:scale-90"
                      title="إضافة سهم للقائمة الحالية"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              {isCreatingList && (
                <div className="flex items-center gap-2 p-2 bg-muted/20 border-b border-border animate-in slide-in-from-top-2">
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="اسم القائمة الجديدة..."
                    className="flex-1 bg-background border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:border-primary"
                    onKeyDown={(e) => { if (e.key === "Enter") createNewWatchlist(); }}
                    autoFocus
                  />
                  <button 
                    onClick={createNewWatchlist} 
                    disabled={isCreatingListLoading || !newListName.trim()}
                    className="p-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
                  >
                    {isCreatingListLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  </button>
                  <button 
                    onClick={() => { setIsCreatingList(false); setNewListName(""); }}
                    className="p-1.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <div className="grid grid-cols-[1.2fr_60px_50px_50px] gap-0 px-2 py-1 border-b border-border text-[9px] text-muted-foreground font-bold bg-muted/5">
                <span className="text-right">الرمز</span>
                <span className="text-left">السعر</span>
                <span className="text-left">التغيير</span>
                <span className="text-left">التغير %</span>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-border/50">
                {watchlist.map((sym) => {
                  const s = STOCK_MAP[sym];
                  if (!s) return null;
                  return (
                    <WatchlistRow
                      key={sym}
                      sym={sym}
                      nameAr={s.nameAr}
                      isCurrent={sym === symbol}
                      onRemove={() => toggleWatchlist(sym)}
                    />
                  );
                })}
              </div>
              {/* Current stock stats */}
              {quote && (
                <div className="border-t border-border p-3 space-y-1.5 text-[11px]">
                  <h4 className="text-[10px] font-bold text-muted-foreground mb-2">الإحصائيات</h4>
                  <StatRow label="الافتتاح"       value={formatPrice(quote.open)} />
                  <StatRow label="الأعلى اليوم"   value={formatPrice(quote.high)} />
                  <StatRow label="الأدنى اليوم"   value={formatPrice(quote.low)} />
                  <StatRow label="أعلى 52 أسبوع"  value={formatPrice(quote.fiftyTwoWeekHigh)} />
                  <StatRow label="أدنى 52 أسبوع"  value={formatPrice(quote.fiftyTwoWeekLow)} />
                  <StatRow label="حجم التداول"    value={formatVolume(quote.volume)} />
                  <StatRow label="القيمة السوقية" value={formatMarketCap(quote.marketCap)} />
                  <StatRow label="مكرر الربحية"   value={quote.trailingPE?.toFixed(1) ?? "—"} />
                  <StatRow label="ربحية السهم"    value={formatPrice(quote.eps)} />
                  <StatRow label="بيتا"           value={quote.beta?.toFixed(2) ?? "—"} />
                </div>
              )}
            </div>

            <TradesTape data={tradesData} loading={loadingTrades} onRefresh={loadTrades} />
          </div>
        </div>
      </div>

      {/* Stock Picker Modal */}
      {showPicker && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => { setShowPicker(false); setPickerSearch(""); }}
        >
          <div
            className="bg-card border border-border rounded-2xl w-[540px] max-h-[80vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-lg font-bold">إضافة سهم للمراقبة</h3>
              <button onClick={() => { setShowPicker(false); setPickerSearch(""); }} className="p-1 rounded hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-5 py-3 border-b border-border">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  autoFocus
                  type="text"
                  placeholder="ابحث بالرمز أو الاسم..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border/50">
              {SAUDI_STOCKS.filter((s) => {
                const q = pickerSearch.toLowerCase();
                return !q || s.symbol.includes(q) || s.nameAr.includes(pickerSearch) || s.nameEn.toLowerCase().includes(q);
              }).map((s) => {
                const inWatchlist = watchlist.includes(s.symbol);
                return (
                  <div key={s.symbol} className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors">
                    <div className="min-w-0">
                      <p className="font-bold text-sm">{s.nameAr}</p>
                      <p className="text-[10px] text-muted-foreground">{s.symbol} · {s.sector}</p>
                    </div>
                    <button
                      onClick={() => toggleWatchlist(s.symbol)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 mr-3 ${
                        inWatchlist
                          ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                          : "bg-primary/10 text-primary hover:bg-primary/20"
                      }`}
                    >
                      {inWatchlist ? "إزالة" : "+ إضافة"}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="px-5 py-3 border-t border-border text-xs text-muted-foreground flex justify-between">
              <span>{watchlist.length} سهم في قائمة المراقبة</span>
              {session?.user && allWatchlists.length > 0 && (
                <span className="truncate max-w-[200px]">
                  القائمة الحالية: <span className="font-bold text-foreground">{allWatchlists.find(w => w.id === watchlistId)?.name}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
}

/* ── Sub Components ── */

function WatchlistRow({ sym, nameAr, isCurrent, onRemove }: { sym: string; nameAr: string; isCurrent: boolean; onRemove: () => void }) {
  const [q, setQ] = useState<{ price: number | null; change: number | null; changePercent: number | null; isUp: boolean } | null>(null);
  const prevPriceRef = useRef<number | null>(null);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    const loadData = () => {
      fetchQuote(sym)
        .then((data) => {
          if (data.price !== null) {
            if (prevPriceRef.current !== null && prevPriceRef.current !== data.price) {
              setFlash(data.price > prevPriceRef.current ? "up" : "down");
              setTimeout(() => setFlash(null), 800);
            }
            prevPriceRef.current = data.price;
          }
          setQ({
            price: data.price,
            change: data.change,
            changePercent: data.changePercent,
            isUp: (data.changePercent ?? 0) >= 0
          });
        })
        .catch(() => {});
    };

    loadData();

    // Poll every 5 seconds for live real-time price ticks
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [sym]);

  return (
    <div className={`group grid grid-cols-[1.2fr_60px_50px_50px] gap-0 items-center px-2 py-1.5 text-xs transition-colors hover:bg-muted/30 relative ${isCurrent ? "bg-primary/5" : ""}`}>
      <Link href={`/symbols/${sym}`} className="min-w-0">
        <span className={`font-bold truncate block ${isCurrent ? "text-primary text-[11px]" : "text-[11px]"}`}>{nameAr}</span>
        <span className="text-muted-foreground text-[9px]">{sym}</span>
      </Link>
      
      {/* Price with tick animation flash background */}
      <span className={`text-left font-bold text-[11px] transition-all duration-300 ${
        flash === "up" ? "bg-emerald-500/25 text-emerald-400 scale-105 rounded px-1 animate-pulse" :
        flash === "down" ? "bg-rose-500/25 text-rose-400 scale-105 rounded px-1 animate-pulse" : ""
      }`} dir="ltr">
        {q ? formatPrice(q.price) : "—"}
      </span>

      <span className={`text-left font-semibold text-[10px] ${q?.isUp ? "text-success" : "text-destructive"}`} dir="ltr">
        {q ? formatChange(q.change) : "—"}
      </span>
      
      <span className={`text-left font-bold text-[10px] ${q?.isUp ? "text-success" : "text-destructive"}`} dir="ltr">
        {q ? formatPercent(q.changePercent) : "—"}
      </span>
      
      <button
        onClick={onRemove}
        className="absolute left-0 top-1/2 -translate-y-1/2 p-0.5 rounded bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold" dir="ltr">{value}</span>
    </div>
  );
}

function formatTradeValue(value: number) {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return value.toFixed(0);
}

function TradesTape({
  data,
  loading,
  onRefresh,
}: {
  data: StockTradesData | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  const trades = data?.trades ?? [];
  const buyVolume = data?.summary.buyVolume ?? 0;
  const sellVolume = data?.summary.sellVolume ?? 0;
  const totalVolume = buyVolume + sellVolume;
  const buyPercent = totalVolume > 0 ? (buyVolume / totalVolume) * 100 : 0;
  const sellPercent = totalVolume > 0 ? (sellVolume / totalVolume) * 100 : 0;

  return (
    <section className="border border-border bg-card rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/10">
        <div>
          <h3 className="text-xs font-black">الصفقات حسب النوع</h3>
          <p className="text-[10px] text-muted-foreground">تقديري من بيانات الدقيقة</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="p-1.5 rounded-lg bg-background border border-border text-muted-foreground hover:text-primary hover:border-primary transition-all"
          title="تحديث الصفقات"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2">
            <p className="text-[10px] text-emerald-300">شراء</p>
            <p className="text-sm font-black" dir="ltr">{formatVolume(buyVolume)}</p>
            <p className="text-[10px] text-muted-foreground" dir="ltr">{buyPercent.toFixed(1)}%</p>
          </div>
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2">
            <p className="text-[10px] text-rose-300">بيع</p>
            <p className="text-sm font-black" dir="ltr">{formatVolume(sellVolume)}</p>
            <p className="text-[10px] text-muted-foreground" dir="ltr">{sellPercent.toFixed(1)}%</p>
          </div>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-muted/40">
          <div className="flex h-full">
            <div className="h-full bg-emerald-500" style={{ width: `${buyPercent}%` }} />
            <div className="h-full bg-rose-500" style={{ width: `${sellPercent}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-[48px_42px_1fr_1fr_1fr] px-1 text-[9px] font-bold text-muted-foreground">
          <span>الوقت</span>
          <span className="text-center">النوع</span>
          <span className="text-left">السعر</span>
          <span className="text-left">الكمية</span>
          <span className="text-left">القيمة</span>
        </div>

        <div className="max-h-[280px] overflow-y-auto divide-y divide-border/50">
          {loading && trades.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">جاري تحميل الصفقات...</div>
          ) : trades.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">لا توجد بيانات صفقات متاحة الآن</div>
          ) : (
            trades.map((trade) => {
              const isBuy = trade.type === "buy";
              return (
                <div key={trade.id} className="grid grid-cols-[48px_42px_1fr_1fr_1fr] items-center px-1 py-2 text-[11px]">
                  <span className="text-muted-foreground" dir="ltr">{trade.time}</span>
                  <span className={`mx-auto rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    isBuy ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"
                  }`}>
                    {isBuy ? "شراء" : "بيع"}
                  </span>
                  <span className="text-left font-bold" dir="ltr">{formatPrice(trade.price)}</span>
                  <span className="text-left text-muted-foreground" dir="ltr">{formatVolume(trade.quantity)}</span>
                  <span className="text-left text-muted-foreground" dir="ltr">{formatTradeValue(trade.value)}</span>
                </div>
              );
            })
          )}
        </div>

        {data?.updatedAt && (
          <p className="border-t border-border pt-2 text-[10px] text-muted-foreground">
            آخر تحديث: {new Date(data.updatedAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
    </section>
  );
}

function OverviewTab({ symbol, quote, nameAr, sector, loading }: {
  symbol: string; quote: StockQuote | null; nameAr: string; sector: string; loading: boolean;
}) {
  const similarStocks = SAUDI_STOCKS.filter(s => s.sector === sector && s.symbol !== symbol).slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Main Stats Card */}
        <div className="md:col-span-2 bg-card border border-border rounded-xl p-4 sm:p-5">
          <h2 className="text-base sm:text-lg font-bold mb-4">الإحصائيات الرئيسية</h2>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="p-3 bg-muted/20 rounded-lg">
                  <div className="h-3 bg-muted/50 rounded animate-pulse mb-2 w-3/4" />
                  <div className="h-5 bg-muted/50 rounded animate-pulse w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-sm">
              <MiniStat label="القيمة السوقية"      value={formatMarketCap(quote?.marketCap ?? null)} />
              <MiniStat label="مكرر الربحية (P/E)"  value={quote?.trailingPE?.toFixed(1) ?? "—"} />
              <MiniStat label="ربحية السهم (EPS)"   value={`${formatPrice(quote?.eps ?? null)}`} />
              <MiniStat label="العائد التوزيعي"      value={quote?.dividendYield ? `${(quote.dividendYield * 100).toFixed(2)}%` : "—"} />
              <MiniStat label="أعلى 52 أسبوع"       value={formatPrice(quote?.fiftyTwoWeekHigh ?? null)} />
              <MiniStat label="أدنى 52 أسبوع"       value={formatPrice(quote?.fiftyTwoWeekLow ?? null)} />
              <MiniStat label="بيتا (Beta)"          value={quote?.beta?.toFixed(2) ?? "—"} />
              <MiniStat label="حجم التداول اليوم"   value={formatVolume(quote?.volume ?? null)} />
            </div>
          )}
        </div>

        {/* Sentiment Gauge Card */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col items-center justify-center text-center">
          <h3 className="text-sm font-bold mb-4 text-muted-foreground">نبض السوق</h3>
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
              <circle cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray="364" strokeDashoffset={364 - (364 * 0.75)} className="text-primary" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-primary">75%</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">إيجابي</span>
            </div>
          </div>
          <p className="text-xs mt-4 font-bold text-muted-foreground">الزخم الشرائي قوي جداً حالياً</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* About Card */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
          <h2 className="text-base sm:text-lg font-bold mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            عن الشركة
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed text-justify">
            {nameAr} هي إحدى الشركات الرائدة المدرجة في السوق المالية السعودية (تداول). تعمل في قطاع {sector} وتتميز بأداء مالي قوي. يتم تداول أسهمها تحت الرمز {symbol} في البورصة السعودية.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-4 text-[10px]">
             <div className="p-2 bg-muted/30 rounded-lg flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-1"><span className="text-muted-foreground">القطاع</span><span className="font-bold truncate w-full sm:w-auto sm:text-left">{sector}</span></div>
             <div className="p-2 bg-muted/30 rounded-lg flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-1"><span className="text-muted-foreground">العملة</span><span className="font-bold uppercase">SAR</span></div>
          </div>
        </div>

        {/* Similar Stocks Card */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-lg font-bold mb-3">شركات مماثلة في قطاع {sector}</h2>
          <div className="space-y-2">
            {similarStocks.length > 0 ? similarStocks.map((s) => (
              <Link key={s.symbol} href={`/symbols/${s.symbol}`} className="flex items-center justify-between p-2 hover:bg-muted/30 rounded-lg transition-colors border border-transparent hover:border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                    {s.symbol}
                  </div>
                  <span className="text-xs font-bold">{s.nameAr}</span>
                </div>
                <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
              </Link>
            )) : (
              <p className="text-xs text-muted-foreground text-center py-4">لا توجد شركات مماثلة حالياً.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getYahooFmt(v: any, fallback: string = "—", decimals: number = 2) {
  if (v == null) return fallback;
  if (typeof v === "number") return v.toFixed(decimals);
  if (v.fmt) return v.fmt;
  if (v.raw != null) return v.raw.toFixed(decimals);
  return fallback;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-muted/20 rounded-lg">
      <p className="text-muted-foreground text-xs mb-1">{label}</p>
      <p className="font-bold text-sm" dir="ltr">{value}</p>
    </div>
  );
}

// ── FinancialsTab ────────────────────────────────────────────────────────────
function FinancialsTab({ summary, loading }: { summary: any; loading: boolean }) {
  const [statement, setStatement] = useState<"income" | "balance" | "cashflow">("income");
  const [period, setPeriod] = useState<"annual" | "quarterly">("annual");

  if (loading) return <TabSkeleton />;
  if (!summary) return <TabEmpty msg="لا توجد بيانات مالية متاحة لهذا السهم حالياً." />;

  const isAnnual = period === "annual";
  const incomeRows = isAnnual ? (summary.income ?? []) : (summary.incomeQ ?? []);
  const balanceRows = isAnnual ? (summary.balance ?? []) : (summary.balanceQ ?? []);
  const cashflowRows = isAnnual ? (summary.cashflow ?? []) : (summary.cashflowQ ?? []);

  const rows = statement === "income" ? incomeRows : statement === "balance" ? balanceRows : cashflowRows;

  const fmtDate = (d: any) => {
    if (!d) return "—";
    const s = typeof d === "string" ? d : d.fmt ?? String(d);
    return s;
  };

  const INCOME_FIELDS: [string, string][] = [
    ["totalRevenue",          "الإيرادات الكلية"],
    ["grossProfit",           "إجمالي الربح"],
    ["operatingIncome",       "الربح التشغيلي"],
    ["netIncome",             "صافي الربح"],
    ["ebit",                  "EBIT"],
    ["incomeBeforeTax",       "الدخل قبل الضريبة"],
    ["incomeTaxExpense",      "ضريبة الدخل"],
  ];
  const BALANCE_FIELDS: [string, string][] = [
    ["totalAssets",           "إجمالي الأصول"],
    ["totalCurrentAssets",    "الأصول المتداولة"],
    ["totalLiab",             "إجمالي الالتزامات"],
    ["totalCurrentLiabilities","الالتزامات المتداولة"],
    ["totalStockholderEquity","حقوق المساهمين"],
    ["cash",                  "النقد"],
    ["longTermDebt",          "الديون طويلة الأجل"],
  ];
  const CASHFLOW_FIELDS: [string, string][] = [
    ["totalCashFromOperatingActivities", "التدفق التشغيلي"],
    ["totalCashflowsFromInvestingActivities","التدفق الاستثماري"],
    ["totalCashFromFinancingActivities", "التدفق التمويلي"],
    ["capitalExpenditures",  "النفقات الرأسمالية"],
    ["freeCashFlow",         "التدفق النقدي الحر"],
  ];
  const fields = statement === "income" ? INCOME_FIELDS : statement === "balance" ? BALANCE_FIELDS : CASHFLOW_FIELDS;

  return (
    <div className="space-y-4">
      <FinancialsChartsSection summary={summary} />

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="bg-card border border-border rounded-xl p-1.5 flex gap-1 flex-wrap items-center shadow-sm">
          {(["income","balance","cashflow"] as const).map((s) => (
            <button key={s} onClick={() => setStatement(s)}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${statement === s ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              {s === "income" ? "قائمة الدخل" : s === "balance" ? "الميزانية" : "التدفقات النقدية"}
            </button>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl p-1 flex items-center shadow-sm">
          {(["annual", "quarterly"] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg font-bold text-[10px] transition-all ${period === p ? "bg-secondary text-secondary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}>
              {p === "annual" ? "سنوي" : "ربع سنوي"}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="p-12 text-center bg-card border border-border rounded-2xl border-dashed">
          <p className="text-muted-foreground mb-4">لا توجد بيانات {period === "annual" ? "سنوية" : "ربع سنوية"} متاحة لهذه القائمة.</p>
          <button 
            onClick={() => setPeriod(period === "annual" ? "quarterly" : "annual")}
            className="text-primary font-bold text-sm hover:underline"
          >
            جرب عرض البيانات {period === "annual" ? "الربع سنوية" : "السنوية"}
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-muted/30 border-b border-border text-muted-foreground">
                <tr>
                  <th className="p-4 font-bold text-foreground">البند (ريال سعودي)</th>
                  {rows.slice(0, 4).map((r: any, i: number) => (
                    <th key={i} className="p-4 font-bold text-center" dir="ltr">{fmtDate(r.endDate)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {fields.map(([key, label]) => (
                  <tr key={key} className="hover:bg-primary/5 transition-colors group">
                    <td className="p-4 font-bold text-muted-foreground group-hover:text-foreground whitespace-nowrap">{label}</td>
                    {rows.slice(0, 4).map((r: any, i: number) => {
                      const val = r[key]?.raw ?? (typeof r[key] === "number" ? r[key] : null);
                      const isNeg = val != null && val < 0;
                      return (
                        <td key={i} className={`p-4 font-mono text-center font-bold ${isNeg ? "text-destructive" : "text-foreground"}`} dir="ltr">
                          {val != null ? (val === 0 ? "0.00" : formatSAR(val)) : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-muted/10 border-t border-border text-[10px] text-muted-foreground text-center">
            ملاحظة: جميع الأرقام بالريال السعودي. المصدر: Yahoo Finance.
          </div>
        </div>
      )}
    </div>
  );
}

// ── TechnicalsTab ────────────────────────────────────────────────────────────
function TechnicalsTab({ summary, quote, chartData, loading }: { summary: any; quote: StockQuote | null; chartData: CandleData[]; loading: boolean }) {
  if (loading) return <TabSkeleton />;

  const fd = summary?.financialData ?? {};
  const ks = summary?.keyStats ?? {};

  const rec = fd.recommendationKey ?? null;
  const recLabel: Record<string, { ar: string; color: string }> = {
    "strong_buy": { ar: "شراء قوي",   color: "text-emerald-400" },
    "buy":        { ar: "شراء",        color: "text-green-400" },
    "hold":       { ar: "محايد",       color: "text-yellow-400" },
    "sell":       { ar: "بيع",         color: "text-orange-400" },
    "strong_sell":{ ar: "بيع قوي",    color: "text-red-500" },
  };
  const recInfo = rec ? recLabel[rec] : null;

  // Simple moving averages from chart data
  const closes = chartData.map(d => d.close);
  const sma = (n: number) => closes.length >= n ? closes.slice(-n).reduce((a, b) => a + b, 0) / n : null;
  const sma20  = sma(20);
  const sma50  = sma(50);
  const sma200 = sma(200);
  const price  = quote?.price ?? null;

  const signal = (avg: number | null) => {
    if (!price || !avg) return null;
    return price > avg ? { label: "فوق المتوسط ↑", color: "text-success" } : { label: "دون المتوسط ↓", color: "text-destructive" };
  };

  return (
    <div className="space-y-4">
      {/* Recommendation */}
      {recInfo && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-lg font-bold mb-3">توصية المحللين</h2>
          <div className="flex items-center gap-4">
            <span className={`text-3xl font-extrabold ${recInfo.color}`}>{recInfo.ar}</span>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>عدد المحللين: <span className="font-bold text-foreground">{getYahooFmt(fd.numberOfAnalystOpinions, "—", 0)}</span></p>
              <p>هدف السعر: <span className="font-bold text-foreground" dir="ltr">{getYahooFmt(fd.targetMeanPrice)} SAR</span></p>
              <p>هدف أعلى: <span className="font-bold text-success" dir="ltr">{getYahooFmt(fd.targetHighPrice)}</span> — هدف أدنى: <span className="font-bold text-destructive" dir="ltr">{getYahooFmt(fd.targetLowPrice)}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Moving Averages */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
        <h2 className="text-base sm:text-lg font-bold mb-4">المتوسطات المتحركة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[["SMA 20", sma20], ["SMA 50", sma50], ["SMA 200", sma200]].map(([label, val]) => {
            const s = signal(val as number | null);
            return (
              <div key={label as string} className="p-4 bg-muted/30 rounded-2xl border border-border/50 group hover:border-primary/30 transition-all">
                <p className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-widest mb-1">{label as string}</p>
                <p className="text-xl sm:text-2xl font-black" dir="ltr">{val != null ? (val as number).toFixed(2) : "—"}</p>
                {s && <p className={`text-[10px] sm:text-xs font-black mt-1.5 flex items-center gap-1 ${s.color}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {s.label}
                </p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Ratios */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
        <h2 className="text-base sm:text-lg font-bold mb-4">نسب مالية رئيسية</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
          <MiniStat label="نسبة السعر/القيمة الدفترية" value={getYahooFmt(ks.priceToBook)} />
          <MiniStat label="EV/EBITDA"                   value={getYahooFmt(ks.enterpriseToEbitda)} />
          <MiniStat label="نسبة الدين/الأصول"           value={getYahooFmt(fd.debtToEquity)} />
          <MiniStat label="العائد على حقوق الملكية"     value={ks.returnOnEquity?.raw != null ? `${(ks.returnOnEquity.raw * 100).toFixed(1)}%` : getYahooFmt(ks.returnOnEquity)} />
          <MiniStat label="العائد على الأصول"            value={fd.returnOnAssets?.raw != null ? `${(fd.returnOnAssets.raw * 100).toFixed(1)}%` : getYahooFmt(fd.returnOnAssets)} />
          <MiniStat label="هامش الربح الصافي"           value={getYahooFmt(fd.profitMargins)} />
          <MiniStat label="نسبة التوزيع"                value={getYahooFmt(ks.payoutRatio)} />
          <MiniStat label="العائد الجاري"               value={getYahooFmt(fd.dividendYield)} />
        </div>
      </div>
    </div>
  );
}

// ── ForecastsTab ─────────────────────────────────────────────────────────────
function ForecastsTab({ summary, loading }: { summary: any; loading: boolean }) {
  if (loading) return <TabSkeleton />;
  if (!summary) return <TabEmpty msg="لا توجد توقعات متاحة حالياً." />;

  const trend = summary.recommendations ?? [];
  const earningsTrend = summary.earningsTrend ?? [];
  const upgrades = summary.upgrades ?? [];

  return (
    <div className="space-y-4">
      {/* Analyst consensus */}
      {trend.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm">
          <h2 className="text-base sm:text-xl font-black mb-6 flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            إجماع المحللين
          </h2>
          {(() => {
            const current = trend[0] ?? {};
            const total = (current.strongBuy ?? 0) + (current.buy ?? 0) + (current.hold ?? 0) + (current.sell ?? 0) + (current.strongSell ?? 0);
            return (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 text-center">
                {[
                  { label: "شراء قوي", val: current.strongBuy ?? 0,   color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
                  { label: "شراء",     val: current.buy ?? 0,          color: "bg-green-500/10 text-green-500 border-green-500/20" },
                  { label: "محايد",    val: current.hold ?? 0,         color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
                  { label: "بيع",      val: current.sell ?? 0,         color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
                  { label: "بيع قوي", val: current.strongSell ?? 0,   color: "bg-red-500/10 text-red-500 border-red-500/20" },
                ].map(({ label, val, color }) => (
                  <div key={label} className={`p-4 sm:p-5 rounded-2xl border ${color} flex flex-col items-center justify-center transition-transform hover:scale-[1.02]`}>
                    <p className="text-2xl sm:text-3xl font-black">{val}</p>
                    <p className="text-[10px] sm:text-xs font-bold mt-1 uppercase tracking-wider">{label}</p>
                    <p className="text-[10px] opacity-60 font-medium">{total ? `${Math.round(val / total * 100)}%` : "0%"}</p>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Price Targets */}
      {summary.financialData && (summary.financialData.targetMeanPrice || summary.financialData.targetHighPrice) && (
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm">
          <h2 className="text-base sm:text-xl font-black mb-6 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            السعر المستهدف للمحللين
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="p-4 sm:p-5 rounded-2xl bg-muted/30 border border-border/50 text-center flex flex-col justify-center">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-widest mb-1">أعلى سعر</p>
              <p className="text-xl sm:text-2xl font-black text-success" dir="ltr">{formatPrice(summary.financialData.targetHighPrice?.raw ?? summary.financialData.targetHighPrice)}</p>
            </div>
            <div className="p-5 sm:p-6 rounded-2xl bg-primary/10 border border-primary/30 text-center flex flex-col justify-center shadow-lg shadow-primary/5">
              <p className="text-[10px] sm:text-xs text-primary font-bold uppercase tracking-widest mb-1">المستهدف المتوسط</p>
              <p className="text-3xl sm:text-4xl font-black text-primary" dir="ltr">{formatPrice(summary.financialData.targetMeanPrice?.raw ?? summary.financialData.targetMeanPrice)}</p>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-muted/30 border border-border/50 text-center flex flex-col justify-center">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-widest mb-1">أدنى سعر</p>
              <p className="text-xl sm:text-2xl font-black text-destructive" dir="ltr">{formatPrice(summary.financialData.targetLowPrice?.raw ?? summary.financialData.targetLowPrice)}</p>
            </div>
          </div>
          {summary.financialData.numberOfAnalystOpinions && (
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-6 text-center font-medium">
              بناءً على آراء {summary.financialData.numberOfAnalystOpinions.raw ?? summary.financialData.numberOfAnalystOpinions} من المحللين المعتمدين.
            </p>
          )}
        </div>
      )}

      {/* Earnings Trend */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          توقعات الأرباح المستقبلية
        </h2>
        {earningsTrend.length === 0 ? (
          <div className="p-8 text-center bg-muted/10 rounded-xl border border-dashed border-border text-muted-foreground">
            لا توجد بيانات توقعات أرباح متاحة لهذه الفترة.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-right text-sm">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                <tr>
                  <th className="p-4 font-bold">الفترة</th>
                  <th className="p-4 font-bold text-center" dir="ltr">EPS المتوقع</th>
                  <th className="p-4 font-bold text-center" dir="ltr">EPS المنخفض</th>
                  <th className="p-4 font-bold text-center" dir="ltr">EPS المرتفع</th>
                  <th className="p-4 font-bold text-center" dir="ltr">المحللون</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {earningsTrend.map((t: any, i: number) => {
                  const est = t.earningsEstimate || {};
                  const periodLabel = {
                    "0q": "الربع الحالي",
                    "+1q": "الربع القادم",
                    "0y": "السنة الحالية",
                    "+1y": "السنة القادمة",
                    "+2y": "السنة بعد القادمة"
                  }[t.period as string] || t.period;

                  return (
                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-bold text-foreground">{periodLabel}</td>
                      <td className="p-4 font-mono text-center font-bold" dir="ltr">{getYahooFmt(est.avg)}</td>
                      <td className="p-4 font-mono text-center text-destructive" dir="ltr">{getYahooFmt(est.low)}</td>
                      <td className="p-4 font-mono text-center text-success" dir="ltr">{getYahooFmt(est.high)}</td>
                      <td className="p-4 font-mono text-center text-muted-foreground" dir="ltr">{getYahooFmt(est.numberOfAnalysts, "—", 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upgrades/Downgrades */}
      {upgrades.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            آخر تغييرات تصنيف المحللين
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {upgrades.slice(0, 8).map((u: any, i: number) => {
              const toGrade = u.toGrade?.toLowerCase() || "";
              const isUp = toGrade.includes("buy") || toGrade.includes("outperform") || u.action === "up";
              const isDown = toGrade.includes("sell") || toGrade.includes("underperform") || u.action === "down";
              
              return (
                <div key={i} className="flex items-center justify-between p-3 sm:p-4 bg-muted/20 border border-border/50 rounded-xl group hover:border-primary/30 transition-all">
                  <div className="min-w-0">
                    <p className="font-bold text-xs sm:text-sm truncate">{u.firm ?? "مؤسسة مالية"}</p>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1">
                      {u.epochGradeDate ? new Date(u.epochGradeDate * 1000).toLocaleDateString("ar-SA", { year: 'numeric', month: 'short', day: 'numeric' }) : "—"}
                    </p>
                  </div>
                  <div className="text-left shrink-0" dir="ltr">
                    <div className="flex items-center gap-1 sm:gap-1.5 justify-end">
                       <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase">{u.fromGrade ?? "—"}</span>
                       <span className="text-muted-foreground text-[10px]">→</span>
                       <span className={`font-bold text-[10px] sm:text-xs px-2 py-0.5 rounded ${isUp ? "bg-success/20 text-success" : isDown ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"}`}>
                         {u.toGrade ?? "—"}
                       </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── NewsTab ──────────────────────────────────────────────────────────────────
function NewsTab({ news, loading }: { news: any[]; loading: boolean }) {
  if (loading) return <TabSkeleton />;
  if (news.length === 0) return <TabEmpty msg="لا توجد أخبار حديثة متاحة لهذا السهم." />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {news.map((item, idx) => (
          <a
            key={idx}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-card border border-border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5 hover:border-primary/50 transition-all shadow-sm hover:shadow-md"
          >
            {item.thumbnail?.resolutions?.[0]?.url && (
              <div className="w-full sm:w-32 h-40 sm:h-24 shrink-0 rounded-xl overflow-hidden border border-border bg-muted/20 shadow-inner relative">
                <Image 
                  src={item.thumbnail.resolutions[0].url} 
                  alt={item.title} 
                  fill
                  sizes="(max-width: 640px) 100vw, 128px"
                  className="object-cover group-hover:scale-110 transition-transform duration-700" 
                />
              </div>
            )}
            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-lg uppercase tracking-wider">
                    {item.publisher}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {new Date(item.providerPublishTime * 1000).toLocaleDateString("ar-SA", { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h3 className="font-bold text-base sm:text-lg leading-snug group-hover:text-primary transition-colors line-clamp-3" dir="ltr">
                  {item.title}
                </h3>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground font-bold group-hover:text-primary transition-all">
                المزيد من التفاصيل <ArrowUpRight className="h-3 w-3" />
              </div>
            </div>
          </a>
        ))}
      </div>
      <div className="p-4 text-center bg-muted/5 border border-dashed border-border rounded-xl">
        <p className="text-xs text-muted-foreground">يتم جلب الأخبار آلياً من مصادر مالية عالمية (Yahoo Finance & Reuters)</p>
      </div>
    </div>
  );
}

// ── CommunityTab ─────────────────────────────────────────────────────────────
function CommunityTab({ symbol, nameAr }: { symbol: string; nameAr: string }) {
  const [msg, setMsg] = useState("");
  const [comments, setComments] = useState([
    { id: 1, user: "أحمد القحطاني", text: `توقعاتكم لسهم ${nameAr} غداً؟ هل يواصل الارتفاع؟`, time: "قبل 15 دقيقة", likes: 12, isPro: true },
    { id: 2, user: "سارة محمد", text: "أعتقد أن نقطة الدعم القادمة عند مستوى 34.50 ريال. السهم للمراقبة.", time: "قبل ساعة", likes: 5, isPro: false },
    { id: 3, user: "خالد عبدالله", text: "نتائج الربع الأول كانت ممتازة جداً، السهم استثماري من الطراز الأول.", time: "قبل 3 ساعات", likes: 24, isPro: true },
  ]);

  const addComment = () => {
    if (!msg.trim()) return;
    setComments([{ id: Date.now(), user: "أنت (زائر)", text: msg, time: "الآن", likes: 0, isPro: false }, ...comments]);
    setMsg("");
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          نقاشات المستثمرين حول {nameAr}
        </h2>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <textarea 
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder="شارك رأيك أو تحليلك حول السهم مع المجتمع..."
                className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px] transition-all resize-none"
              />
              <div className="flex justify-end">
                <button 
                  onClick={addComment}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
                >
                  نشر التعليق
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 space-y-6">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-4 group">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${c.isPro ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"}`}>
                  <span className="text-xs font-bold">{c.user[0]}</span>
                </div>
                <div className="flex-1 bg-muted/10 border border-border/50 rounded-2xl p-4 group-hover:border-primary/20 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{c.user}</span>
                      {c.isPro && <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">PRO</span>}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{c.time}</span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">{c.text}</p>
                  <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground">
                    <button className="hover:text-primary flex items-center gap-1 font-bold transition-colors">
                      <TrendingUp className="h-3 w-3" /> {c.likes} إعجاب
                    </button>
                    <button className="hover:text-primary font-bold transition-colors">رد</button>
                    <button className="hover:text-primary font-bold transition-colors">إبلاغ</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="p-4 text-center bg-primary/5 border border-primary/10 rounded-xl">
        <p className="text-xs text-primary font-bold">انضم إلى آلاف المستثمرين وشارك تحليلاتك في منصة ذكاء الأسهم السعودية</p>
      </div>
    </div>
  );
}

// ── ProfileTab ───────────────────────────────────────────────────────────────
function ProfileTab({ symbol, summary, loading }: { symbol: string; summary: any; loading: boolean }) {
  if (loading) return <TabSkeleton />;
  
  const stockInfo = STOCK_MAP[symbol];
  const p = summary?.profile;
  
  // Use local Arabic description if available, otherwise fallback to Yahoo (which is English)
  const description = stockInfo?.descriptionAr || p?.longBusinessSummary || "لا توجد نبذة متاحة حالياً باللغة العربية.";

  // Translation map for common profile values
  const translateValue = (val: string | null | undefined) => {
    if (!val) return "—";
    const dict: Record<string, string> = {
      "Saudi Arabia": "المملكة العربية السعودية",
      "Riyadh": "الرياض",
      "Dhahran": "الظهران",
      "Jeddah": "جدة",
      "Al-Khobar": "الخبر",
      "Dammam": "الدمام",
      "Jubail": "الجبيل",
      "Buraydah": "بريدة",
      "Energy": "الطاقة",
      "Financial Services": "الخدمات المالية",
      "Basic Materials": "المواد الأساسية",
      "Communication Services": "خدمات الاتصالات",
      "Consumer Defensive": "الاستهلاك الدفاعي",
      "Consumer Cyclical": "الاستهلاك الدوري",
      "Industrials": "الصناعات",
      "Utilities": "المنافع العامة",
      "Real Estate": "العقارات",
      "Oil & Gas Integrated": "النفط والغاز المتكاملة",
      "Banks—Regional": "البنوك الإقليمية",
      "Chemicals": "الكيماويات",
      "Telecom Services": "خدمات الاتصالات",
      "Food Distribution": "توزيع الأغذية",
      "Specialty Retail": "تجارة التجزئة المتخصصة",
      "Marine Shipping": "النقل البحري",
      "Beverages—Non-Alcoholic": "المشروبات غير الكحولية",
      "Insurance—Specialty": "التأمين المتخصص",
      "Real Estate—Development": "التطوير العقاري",
    };
    return dict[val] || val;
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          نبذة عن الشركة
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed mb-6 text-justify">
          {description}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "القطاع", value: stockInfo?.sector || translateValue(p?.sector) },
            { label: "الصناعة", value: translateValue(p?.industry) },
            { label: "الدولة", value: translateValue(p?.country) },
            { label: "المدينة", value: translateValue(p?.city) },
            { label: "الموظفون", value: p?.fullTimeEmployees?.toLocaleString() || "—" },
            { label: "الموقع الإلكتروني", value: p?.website || "—", isLink: true },
          ].map((item, idx) => (
            <div key={idx} className="p-3 bg-muted/20 border border-border/50 rounded-xl flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{item.label}</span>
              {item.isLink && item.value !== "—" ? (
                <a href={item.value.startsWith("http") ? item.value : `https://${item.value}`} 
                   target="_blank" rel="noopener noreferrer" 
                   className="font-bold text-sm text-primary hover:underline truncate">
                  {item.value.replace(/^https?:\/\/(www\.)?/, "")}
                </a>
              ) : (
                <span className="font-bold text-sm truncate">{item.value}</span>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Additional Company Info Card */}
      <div className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 rounded-xl p-5">
        <p className="text-xs text-muted-foreground text-center">
          بيانات الشركة مستمدة من مصادر رسمية ويتم تحديثها دورياً عبر Yahoo Finance و Tadawul.
        </p>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function TabSkeleton() {
  const widths = ["90%", "75%", "85%", "60%", "70%"];
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-8 bg-muted/40 rounded animate-pulse" style={{ width: widths[i % widths.length] }} />
      ))}
    </div>
  );
}

function TabEmpty({ msg }: { msg: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
      <p>{msg}</p>
    </div>
  );
}
