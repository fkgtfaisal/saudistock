"use client";

import { useState, use, useCallback } from "react";
import Link from "next/link";
import { ChartComponent } from "@/components/ChartComponent";
import {
  ArrowRight,
  Maximize2,
  Minimize2,
  Camera,
  Settings,
  ChevronDown,
} from "lucide-react";

// Simple seed-based pseudo-random number generator
function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

// Generate dummy candlestick data
function generateDummyData(seed: number = 1, count: number = 365) {
  const data = [];
  const random = mulberry32(seed);
  let currentPrice = 30.0 + seed * 10;
  let currentDate = new Date();
  currentDate.setFullYear(currentDate.getFullYear() - Math.ceil(count / 250));

  for (let i = 0; i < count; i++) {
    const open = currentPrice + (random() - 0.5) * 2;
    const close = open + (random() - 0.5) * 3;
    const high = Math.max(open, close) + random();
    const low = Math.min(open, close) - random();
    const time = currentDate.toISOString().split("T")[0];

    data.push({ time, open, high, low, close });
    currentPrice = close;
    currentDate.setDate(currentDate.getDate() + 1);
    if (currentDate.getDay() === 6) currentDate.setDate(currentDate.getDate() + 2);
  }
  return data;
}

// Mock stock list for quick-switch dropdown
const stockList = [
  { symbol: "2010", name: "سابك" },
  { symbol: "2222", name: "أرامكو" },
  { symbol: "1120", name: "الراجحي" },
  { symbol: "1180", name: "الأهلي" },
  { symbol: "2350", name: "كيان" },
  { symbol: "7010", name: "STC" },
  { symbol: "2060", name: "الاتصالات" },
  { symbol: "4200", name: "الدريس" },
  { symbol: "1010", name: "الرياض" },
  { symbol: "3010", name: "أسمنت العربية" },
];

const timeframes = [
  { id: "1m", label: "1 دقيقة", seed: 1, count: 200 },
  { id: "5m", label: "5 دقائق", seed: 2, count: 200 },
  { id: "15m", label: "15 دقيقة", seed: 3, count: 200 },
  { id: "1h", label: "1 ساعة", seed: 4, count: 250 },
  { id: "4h", label: "4 ساعات", seed: 5, count: 250 },
  { id: "1D", label: "يومي", seed: 1, count: 365 },
  { id: "1W", label: "أسبوعي", seed: 2, count: 200 },
  { id: "1M", label: "شهري", seed: 3, count: 120 },
  { id: "3M", label: "3 أشهر", seed: 4, count: 180 },
  { id: "6M", label: "6 أشهر", seed: 5, count: 250 },
  { id: "1Y", label: "سنة", seed: 6, count: 365 },
  { id: "5Y", label: "5 سنوات", seed: 7, count: 1250 },
  { id: "ALL", label: "الكل", seed: 8, count: 2500 },
];

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
  const [activeTimeframe, setActiveTimeframe] = useState("1D");
  const [indicators, setIndicators] = useState<string[]>([]);
  const [chartData, setChartData] = useState(() => generateDummyData(1, 365));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);
  const [showIndicatorDropdown, setShowIndicatorDropdown] = useState(false);

  const currentStock = stockList.find((s) => s.symbol === symbol) || { symbol, name: `سهم ${symbol}` };

  const handleTimeframeChange = useCallback((tf: typeof timeframes[0]) => {
    setActiveTimeframe(tf.id);
    setChartData(generateDummyData(tf.seed, tf.count));
  }, []);

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
      <div className="flex items-center gap-1 px-3 py-2 bg-card border-b border-border shrink-0 relative z-50">
        {/* Back to symbol page */}
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
            <span className="text-foreground">{currentStock.name}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
          {showSymbolDropdown && (
            <div className="absolute top-full right-0 mt-1 w-60 bg-popover border border-border rounded-lg shadow-xl z-[100] max-h-64 overflow-y-auto">
              {stockList.map((stock) => (
                <Link
                  key={stock.symbol}
                  href={`/chart/${stock.symbol}`}
                  onClick={() => setShowSymbolDropdown(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${
                    stock.symbol === symbol ? "bg-primary/10 text-primary" : ""
                  }`}
                >
                  <span className="font-mono font-bold w-12 text-left" dir="ltr">{stock.symbol}</span>
                  <span className="text-foreground">{stock.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-border mx-1"></div>

        {/* Timeframes */}
        <div className="flex items-center gap-1">
          {timeframes.map((tf) => (
            <button
              key={tf.id}
              onClick={() => handleTimeframeChange(tf)}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-colors whitespace-nowrap ${
                activeTimeframe === tf.id
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tf.id}
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

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Right-side actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              // Screenshot placeholder
              alert("سيتم حفظ صورة من الرسم البياني");
            }}
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

      {/* Price Bar */}
      <div className="flex items-center gap-4 px-4 py-1.5 bg-card/50 border-b border-border shrink-0 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">آخر:</span>
          <span className="font-bold text-lg text-foreground" dir="ltr">32.40</span>
          <span className="text-success font-bold" dir="ltr">+1.20 (+3.8%)</span>
        </div>
        <div className="h-4 w-px bg-border"></div>
        <div className="flex items-center gap-4 text-muted-foreground">
          <span>الافتتاح: <strong className="text-foreground" dir="ltr">31.20</strong></span>
          <span>الأعلى: <strong className="text-success" dir="ltr">33.10</strong></span>
          <span>الأدنى: <strong className="text-destructive" dir="ltr">30.80</strong></span>
          <span>الحجم: <strong className="text-foreground" dir="ltr">12.5M</strong></span>
        </div>
      </div>

      {/* Main Chart Area (fills remaining space) */}
      <div className="flex-1 min-h-0 p-1">
        <ChartComponent data={chartData} indicators={indicators} />
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center justify-between px-4 py-1 bg-card border-t border-border text-[10px] text-muted-foreground shrink-0">
        <div className="flex items-center gap-4">
          <span>UTC+3 توقيت الرياض</span>
          <span>•</span>
          <span>{activeTimeframe} — {timeframes.find(t => t.id === activeTimeframe)?.label}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>بيانات تجريبية</span>
          <span>•</span>
          <span>منصة ذكاء الأسهم السعودية</span>
        </div>
      </div>
    </div>
  );
}
