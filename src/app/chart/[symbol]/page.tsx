"use client";

import { useState, useEffect, useCallback, use, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ChartComponent } from "@/components/ChartComponent";
import {
  fetchQuote, fetchChart,
  type StockQuote, type CandleData,
  formatPrice, formatChange, formatPercent, formatVolume
} from "@/lib/market-api";
import { STOCK_MAP } from "@/lib/stocks";
import {
  ArrowRight,
  Maximize2,
  Minimize2,
  Camera,
  Settings,
  ChevronDown,
  Plus,
  RefreshCw,
  Check,
  X
} from "lucide-react";

const TIMEFRAMES = ["1D","1W","1M","3M","6M","1Y","5Y","ALL"];

const indicatorsList = [
  { id: "SMA", label: "SMA متوسط متحرك", color: "#3b82f6" },
  { id: "EMA", label: "EMA متوسط أسّي", color: "#06b6d4" },
  { id: "RSI", label: "RSI مؤشر القوة النسبية", color: "#8b5cf6" },
  { id: "MACD", label: "MACD ماكد", color: "#f59e0b" },
  { id: "BB", label: "Bollinger Bands بولنجر", color: "#ec4899" },
  { id: "VWAP", label: "VWAP متوسط السعر المرجح", color: "#14b8a6" },
];

export default function ChartPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = use(params);
  const info = STOCK_MAP[symbol];
  const { data: session } = useSession();

  const [activeTimeframe, setActiveTimeframe] = useState("1Y");
  const [indicators, setIndicators] = useState<string[]>([]);
  const hasLoadedSettings = useRef(false);
  
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [chartData, setChartData] = useState<CandleData[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);
  const [showIndicatorDropdown, setShowIndicatorDropdown] = useState(false);
  const [showWatchlistDropdown, setShowWatchlistDropdown] = useState(false);

  // Watchlist states
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [watchlistId, setWatchlistId] = useState<string | null>(null);
  const [allWatchlists, setAllWatchlists] = useState<any[]>([]);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [isCreatingListLoading, setIsCreatingListLoading] = useState(false);

  const currentStock = info || { symbol, nameAr: `سهم ${symbol}`, sector: "" };

  const loadQuote = useCallback(async () => {
    try {
      const q = await fetchQuote(symbol);
      setQuote(q);
    } catch { /* keep previous data */ }
  }, [symbol]);

  const loadChart = useCallback(async () => {
    try {
      setLoadingChart(true);
      const data = await fetchChart(symbol, activeTimeframe);
      setChartData(data);
    } catch {
      //
    } finally {
      setLoadingChart(false);
    }
  }, [symbol, activeTimeframe]);

  useEffect(() => {
    loadQuote();
    loadChart();
  }, [loadQuote, loadChart]);

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
            if (layoutData.timeframe) setActiveTimeframe(layoutData.timeframe);
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
              timeframe: activeTimeframe,
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
  }, [activeTimeframe, indicators, symbol, session]);

  // Watchlist functions
  useEffect(() => {
    const fetchWatchlist = async () => {
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
        // Fallback for non-logged in users
        const local = localStorage.getItem("tadawul_terminal_watchlist");
        if (local) {
          try { setWatchlist(JSON.parse(local)); } catch { setWatchlist([]); }
        }
      }
    };
    fetchWatchlist();
  }, [session, watchlistId]);

  const toggleWatchlist = async (sym: string) => {
    const inWatchlist = watchlist.includes(sym);
    if (inWatchlist) {
      setWatchlist((w) => w.filter((x) => x !== sym));
      setAllWatchlists(all => all.map(w => w.id === watchlistId ? { ...w, items: w.items.filter((i: any) => i.symbol !== sym) } : w));
    } else {
      setWatchlist((w) => [...w, sym]);
      setAllWatchlists(all => all.map(w => w.id === watchlistId ? { ...w, items: [...w.items, { symbol: sym }] } : w));
    }
    if (!session?.user) {
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

  const toggleIndicator = useCallback((ind: string) => {
    setIndicators((prev) =>
      prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind]
    );
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-background">
      {/* Top Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 bg-card border-b border-border shrink-0 relative z-50 overflow-x-auto hide-scrollbar scroll-smooth">
        <Link
          href={`/symbols/${symbol}`}
          className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-1"
          title="العودة لصفحة السهم"
        >
          <ArrowRight className="h-4 w-4" />
        </Link>

        <div className="h-6 w-px bg-border mx-1"></div>

        {/* Symbol Selector */}
        <div className="relative">
          <button
            onClick={() => { setShowSymbolDropdown(!showSymbolDropdown); setShowIndicatorDropdown(false); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-muted/50 hover:bg-muted text-sm font-bold transition-colors"
          >
            <span className="text-primary">{currentStock.symbol}</span>
            <span className="text-foreground">{currentStock.nameAr}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
          {showSymbolDropdown && (
            <div className="absolute top-full right-0 mt-1 w-64 bg-popover border border-border rounded-lg shadow-xl z-[100] max-h-80 overflow-y-auto">
              {Object.values(STOCK_MAP).map((stock) => (
                <Link
                  key={stock.symbol}
                  href={`/chart/${stock.symbol}`}
                  onClick={() => setShowSymbolDropdown(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${
                    stock.symbol === symbol ? "bg-primary/10 text-primary" : ""
                  }`}
                >
                  <span className="font-mono font-bold w-12 text-left" dir="ltr">{stock.symbol}</span>
                  <span className="text-foreground">{stock.nameAr}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-border mx-1"></div>

        {/* Timeframes */}
        <div className="flex items-center gap-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setActiveTimeframe(tf)}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-colors whitespace-nowrap ${
                activeTimeframe === tf
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-border mx-1"></div>

        {/* Indicators Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowIndicatorDropdown(!showIndicatorDropdown); setShowSymbolDropdown(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <span>المؤشرات</span>
            {indicators.length > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {indicators.length}
              </span>
            )}
            <ChevronDown className="h-3 w-3" />
          </button>
          {showIndicatorDropdown && (
            <div className="absolute top-full right-0 mt-1 w-72 bg-popover border border-border rounded-lg shadow-xl z-[100]">
              <div className="p-2 border-b border-border">
                <span className="text-xs text-muted-foreground font-bold px-2">المؤشرات الفنية</span>
              </div>
              {indicatorsList.map((ind) => (
                <button
                  key={ind.id}
                  onClick={() => toggleIndicator(ind.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-right ${
                    indicators.includes(ind.id) ? "bg-primary/5" : ""
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-sm border-2 transition-colors ${
                      indicators.includes(ind.id) ? "border-primary bg-primary" : "border-muted-foreground"
                    }`}
                  />
                  <span className="font-bold" style={{ color: ind.color }}>{ind.id}</span>
                  <span className="text-muted-foreground text-xs">{ind.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Active Indicator Chips */}
        {indicators.length > 0 && (
          <div className="flex items-center gap-1 mr-1">
            {indicators.map((ind) => {
              const info = indicatorsList.find((i) => i.id === ind);
              return (
                <button
                  key={ind}
                  onClick={() => toggleIndicator(ind)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors hover:bg-destructive/10 hover:border-destructive"
                  style={{ borderColor: info?.color, color: info?.color }}
                >
                  {ind}
                  <span className="text-muted-foreground">×</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex-1"></div>

        {/* Watchlist Actions */}
        <div className="flex items-center gap-2 border-r border-border pr-3 mr-3">
          {session?.user && (
            <button 
              onClick={() => setIsCreatingList(!isCreatingList)}
              className="p-1.5 rounded bg-background border border-border hover:border-primary text-muted-foreground hover:text-primary transition-all"
              title="إنشاء قائمة جديدة"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
          {session?.user && allWatchlists.length > 0 ? (
            <div className="relative flex items-center group">
              <button
                onClick={() => { setShowWatchlistDropdown(!showWatchlistDropdown); setShowSymbolDropdown(false); setShowIndicatorDropdown(false); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded bg-muted/50 hover:bg-muted text-sm font-bold transition-colors"
                title="عرض قائمة المراقبة"
              >
                <span className="text-primary">{allWatchlists.find(w => w.id === watchlistId)?.name || 'القائمة'}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>

              {showWatchlistDropdown && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-popover border border-border rounded-lg shadow-xl z-[100] max-h-80 flex flex-col">
                  {/* Select Watchlist */}
                  <div className="p-2 border-b border-border bg-muted/30">
                    <select 
                      value={watchlistId || ""} 
                      onChange={(e) => handleWatchlistChange(e.target.value)}
                      className="w-full bg-background border border-border text-xs font-bold focus:outline-none focus:border-primary p-1.5 rounded cursor-pointer"
                    >
                      {allWatchlists.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  {/* Stocks in Watchlist */}
                  <div className="overflow-y-auto flex-1 p-1">
                    {watchlist.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        القائمة فارغة
                      </div>
                    ) : (
                      watchlist.map(sym => {
                        const sInfo = STOCK_MAP[sym];
                        return (
                          <Link
                            key={sym}
                            href={`/chart/${sym}`}
                            onClick={() => setShowWatchlistDropdown(false)}
                            className={`flex items-center justify-between px-3 py-2 text-sm hover:bg-muted rounded transition-colors ${
                              sym === symbol ? "bg-primary/10 text-primary" : "text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs w-10 text-left" dir="ltr">{sym}</span>
                              <span className="font-bold text-xs">{sInfo?.nameAr || `سهم ${sym}`}</span>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
          
          <button
            onClick={() => toggleWatchlist(symbol)}
            className={`p-1.5 rounded transition-all flex items-center gap-1 text-xs font-bold ${
              watchlist.includes(symbol)
                ? "bg-primary/20 text-primary hover:bg-destructive/20 hover:text-destructive"
                : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
            }`}
            title={watchlist.includes(symbol) ? "إزالة من القائمة" : "إضافة للقائمة الحالية"}
          >
            {watchlist.includes(symbol) ? (
              <>
                <Check className="h-3 w-3" />
                <span className="hidden sm:inline">في القائمة</span>
              </>
            ) : (
              <>
                <Plus className="h-3 w-3" />
                <span className="hidden sm:inline">إضافة للمراقبة</span>
              </>
            )}
          </button>
        </div>

        {/* Fullscreen etc */}
        <div className="flex items-center gap-1 border-r border-border pr-2">
          <button
            onClick={() => alert("سيتم حفظ صورة من الرسم البياني")}
            className="p-1.5 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="حفظ صورة"
          >
            <Camera className="h-4 w-4" />
          </button>
          <button
            className="p-1.5 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="إعدادات الرسم"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title={isFullscreen ? "الخروج من ملء الشاشة" : "ملء الشاشة"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Inline Create List */}
      {isCreatingList && (
        <div className="flex items-center gap-2 px-3 py-1 bg-muted/20 border-b border-border animate-in slide-in-from-top-1 z-40 relative">
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="اسم القائمة الجديدة..."
            className="w-64 bg-background border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-primary"
            onKeyDown={(e) => { if (e.key === "Enter") createNewWatchlist(); }}
            autoFocus
          />
          <button 
            onClick={createNewWatchlist} 
            disabled={isCreatingListLoading || !newListName.trim()}
            className="p-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {isCreatingListLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          </button>
          <button 
            onClick={() => { setIsCreatingList(false); setNewListName(""); }}
            className="p-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Price Bar */}
      <div className="flex items-center gap-4 px-4 py-1.5 bg-card/50 border-b border-border shrink-0 text-xs overflow-x-auto hide-scrollbar whitespace-nowrap">
        {quote ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">آخر:</span>
              <span className="font-bold text-lg text-foreground" dir="ltr">{formatPrice(quote.price)}</span>
              <span className={`font-bold ${(quote.change || 0) >= 0 ? "text-success" : "text-destructive"}`} dir="ltr">
                {(quote.change || 0) >= 0 ? "+" : ""}{formatChange(quote.change || 0)} ({(quote.change || 0) >= 0 ? "+" : ""}{formatPercent(quote.changePercent || 0)})
              </span>
            </div>
            <div className="flex items-center">
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
            </div>
            <div className="h-4 w-px bg-border"></div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>الافتتاح: <strong className="text-foreground" dir="ltr">{formatPrice(quote.open)}</strong></span>
              <span>الأعلى: <strong className="text-success" dir="ltr">{formatPrice(quote.high)}</strong></span>
              <span>الأدنى: <strong className="text-destructive" dir="ltr">{formatPrice(quote.low)}</strong></span>
              <span>الحجم: <strong className="text-foreground" dir="ltr">{formatVolume(quote.volume)}</strong></span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">جاري تحميل الأسعار...</span>
          </div>
        )}
      </div>

      {/* Main Chart Area */}
      <div className="flex-1 min-h-0 p-1">
        {loadingChart ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-card rounded-xl border border-border shadow-sm">
            <RefreshCw className="h-8 w-8 text-primary animate-spin mb-4" />
            <p className="text-sm font-bold text-muted-foreground">جاري تحميل بيانات الرسم البياني...</p>
          </div>
        ) : (
          <ChartComponent data={chartData} symbol={symbol} indicators={indicators} />
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center justify-between px-4 py-1 bg-card border-t border-border text-[10px] text-muted-foreground shrink-0">
        <div className="flex items-center gap-4">
          <span>UTC+3 توقيت الرياض</span>
          <span>•</span>
          <span>{activeTimeframe}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{chartData.length} شمعة محملة</span>
          <span>•</span>
          <span>منصة ذكاء الأسهم السعودية</span>
        </div>
      </div>
    </div>
  );
}
