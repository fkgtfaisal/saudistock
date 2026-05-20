"use client";

import { useState, useEffect, useRef } from "react";
import { 
  BrainCircuit, 
  Lock, 
  Sparkles, 
  TrendingUp, 
  TrendingDown,
  Coins, 
  Play, 
  Key, 
  HelpCircle, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Info, 
  Calendar, 
  ChevronDown, 
  Search,
  Eye,
  EyeOff,
  RefreshCw,
  BarChart3,
  DollarSign,
  Percent
} from "lucide-react";
import { SAUDI_STOCKS, STOCK_MAP, StockInfo } from "@/lib/stocks";
import { runBacktest, BacktestResult, ChartBar } from "@/lib/backtest";

export default function AIAnalysisPage() {
  const [activeTab, setActiveTab] = useState<"ai-analyst" | "backtest">("ai-analyst");
  const [selectedSymbol, setSelectedSymbol] = useState<string>("2222"); // Saudi Aramco
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // AI Analyst state
  const [openaiApiKey, setOpenaiApiKey] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<string>("");
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [aiRating, setAiRating] = useState<string>("");
  const [loadingStep, setLoadingStep] = useState<string>("");

  // Backtest state
  const [strategy, setStrategy] = useState<"EMA_CROSS" | "RSI" | "MACD">("EMA_CROSS");
  const [initialCapital, setInitialCapital] = useState<number>(100000);
  const [timeframe, setTimeframe] = useState<string>("1Y");
  const [loadingBacktest, setLoadingBacktest] = useState<boolean>(false);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [backtestError, setBacktestError] = useState<string>("");

  const currentStock: StockInfo = STOCK_MAP[selectedSymbol] || SAUDI_STOCKS[0];

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem("saudistock_openai_key");
    if (savedKey) setOpenaiApiKey(savedKey);
  }, []);

  // Save API key
  const handleSaveApiKey = (key: string) => {
    setOpenaiApiKey(key);
    localStorage.setItem("saudistock_openai_key", key);
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter stocks based on search query
  const filteredStocks = SAUDI_STOCKS.filter(
    (stock) =>
      stock.symbol.includes(searchQuery) ||
      stock.nameAr.includes(searchQuery) ||
      stock.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Trigger AI analysis
  const handleGenerateAIReport = async () => {
    setLoadingAI(true);
    setAiReport("");
    setAiScore(null);
    setAiRating("");

    const steps = [
      "جاري الاتصال بقاعدة بيانات تداول الحية...",
      "جاري جلب قائمة الدخل والميزانية العمومية للشركة...",
      "جاري فحص مؤشر القوة النسبية RSI والـ MACD...",
      "جاري حساب متوسطات الحركة EMA 20 و 50 و 200...",
      "جاري صياغة تقرير التحليل المالي والتقييم الاستثماري...",
    ];

    let stepIndex = 0;
    setLoadingStep(steps[0]);
    const stepInterval = setInterval(() => {
      if (stepIndex < steps.length - 1) {
        stepIndex++;
        setLoadingStep(steps[stepIndex]);
      }
    }, 2000);

    try {
      const res = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: selectedSymbol, openaiApiKey }),
      });

      const data = await res.json();
      clearInterval(stepInterval);

      if (res.ok) {
        setAiReport(data.analysis);
        if (data.score) setAiScore(data.score);
        if (data.rating) setAiRating(data.rating);
      } else {
        setAiReport(`### ❌ فشل توليد التقرير\n\n${data.error || "حدث خطأ غير معروف أثناء الاتصال بالسيرفر."}`);
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      setAiReport(`### ❌ خطأ في الاتصال\n\nفشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مجدداً.`);
    } finally {
      setLoadingAI(false);
    }
  };

  // Run Backtest
  const handleRunBacktest = async () => {
    setLoadingBacktest(true);
    setBacktestError("");
    setBacktestResult(null);

    try {
      const res = await fetch(`/api/chart/${selectedSymbol}?timeframe=${timeframe}`);
      if (!res.ok) {
        throw new Error("فشل جلب بيانات الشارت التاريخية للسهم.");
      }

      const chartData: ChartBar[] = await res.json();
      if (!chartData || chartData.length < 30) {
        throw new Error("بيانات السهم غير كافية لفترة الاختبار المحددة (أقل من 30 يوماً).");
      }

      const result = runBacktest(selectedSymbol, chartData, strategy, initialCapital);
      setBacktestResult(result);
    } catch (err: any) {
      setBacktestError(err.message || "حدث خطأ غير متوقع أثناء محاكاة الصفقات.");
    } finally {
      setLoadingBacktest(false);
    }
  };

  // Run backtest automatically on stock change when active tab is backtest
  useEffect(() => {
    if (activeTab === "backtest") {
      handleRunBacktest();
    }
  }, [selectedSymbol, strategy, timeframe, activeTab]);

  // Formatter utilities
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR" }).format(val);
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "bg-success text-success-foreground border-success/40";
    if (score >= 60) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (score >= 40) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-destructive/10 text-destructive border-destructive/20";
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold mb-2 tracking-tight flex items-center gap-3 bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
            مركز الذكاء المالي المتطور <Sparkles className="h-7 w-7 text-primary animate-pulse" />
          </h1>
          <p className="text-muted-foreground text-sm">
            حلول استشارية متكاملة بذكاء اصطناعي خبير ومحرك محاكاة الصفقات التاريخية للسوق السعودي.
          </p>
        </div>

        {/* Customized Stock Selector */}
        <div className="relative w-full md:w-80" ref={dropdownRef}>
          <label className="block text-xs font-bold text-muted-foreground mb-1 mr-1">السهم النشط للتحليل:</label>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full flex items-center justify-between bg-card border border-border hover:border-primary/50 px-4 py-3 rounded-lg shadow-sm transition-all text-right"
          >
            <div className="flex items-center gap-2">
              <span className="bg-primary/10 text-primary text-xs font-extrabold px-2.5 py-0.5 rounded">
                {currentStock.symbol}
              </span>
              <span className="font-bold text-foreground text-sm">{currentStock.nameAr}</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${showDropdown ? "rotate-180" : ""}`} />
          </button>

          {showDropdown && (
            <div className="absolute left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in-50 slide-in-from-top-4 duration-200">
              <div className="p-3 border-b border-border flex items-center gap-2 bg-muted/20">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="ابحث برمز السهم أو الاسم..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-0 outline-none text-sm text-foreground focus:ring-0 p-0"
                  autoFocus
                />
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-border">
                {filteredStocks.length > 0 ? (
                  filteredStocks.map((stock) => (
                    <button
                      key={stock.symbol}
                      onClick={() => {
                        setSelectedSymbol(stock.symbol);
                        setShowDropdown(false);
                        setSearchQuery("");
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-muted/50 text-right ${selectedSymbol === stock.symbol ? "bg-primary/5 text-primary font-bold" : ""}`}
                    >
                      <span className="font-medium text-foreground">{stock.nameAr}</span>
                      <span className="text-xs text-muted-foreground font-mono">{stock.symbol}</span>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-muted-foreground">لا توجد أسهم تطابق بحثك.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex p-1 bg-muted/50 rounded-xl max-w-md mb-8 border border-border/60">
        <button
          onClick={() => setActiveTab("ai-analyst")}
          className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === "ai-analyst" 
              ? "bg-card text-primary shadow-lg border border-border" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BrainCircuit className="h-4 w-4" />
          مستشار الـ AI المالي
        </button>
        <button
          onClick={() => setActiveTab("backtest")}
          className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === "backtest" 
              ? "bg-card text-primary shadow-lg border border-border" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          محاكي الاستراتيجيات
        </button>
      </div>

      {/* Tab 1: AI Analyst */}
      {activeTab === "ai-analyst" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings & Description Sidebar */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Info Card */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-3 text-foreground flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" /> نبذة عن السهم
              </h2>
              <h3 className="font-extrabold text-2xl text-foreground mb-1">{currentStock.nameAr}</h3>
              <p className="text-xs text-muted-foreground font-mono mb-4">{currentStock.symbol} | {currentStock.sector}</p>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                {currentStock.descriptionAr || "شركة مساهمة رائدة مدرجة في السوق المالية السعودية (تداول)."}
              </p>
            </div>

            {/* API Key settings card */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-5">
                <Key className="h-16 w-16" />
              </div>
              <h2 className="text-lg font-bold mb-2 text-foreground flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" /> مفتاح OpenAI API (اختياري)
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                أدخل مفتاح OpenAI الخاص بك (sk-...) لتفعيل وضع التحليل المتعمق والدردشة الذكية عبر طرازات GPT المتقدمة. في حال تركه فارغاً، سيتولى **المحرك الخبير المحلي** صياغة تقرير عربي مالي فائق الدقة مجاناً.
              </p>
              
              <div className="relative mb-3">
                <input
                  type={showApiKey ? "text" : "password"}
                  placeholder="sk-..."
                  value={openaiApiKey}
                  onChange={(e) => handleSaveApiKey(e.target.value)}
                  className="w-full bg-muted/50 border border-border focus:border-primary rounded-lg py-2 px-3 pl-10 text-xs font-mono outline-none text-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/80 text-left">* يتم حفظ المفتاح بشكل آمن ومحلي بالكامل داخل جهازك.</p>
            </div>

            {/* Launch analysis Button */}
            <button
              onClick={handleGenerateAIReport}
              disabled={loadingAI}
              className="w-full bg-gradient-to-r from-primary to-primary/95 hover:from-primary/95 hover:to-primary/90 text-primary-foreground font-extrabold py-4 px-6 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-base"
            >
              {loadingAI ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  جاري إعداد التقرير...
                </>
              ) : (
                <>
                  <BrainCircuit className="h-5 w-5" />
                  تشغيل التحليل الأساسي الذكي
                </>
              )}
            </button>
          </div>

          {/* AI Report Viewer */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-3xl min-h-[500px] p-8 shadow-sm flex flex-col justify-between relative overflow-hidden">
              {/* Decorative top bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/30 via-primary to-primary-foreground/30"></div>

              {/* Initial empty state */}
              {!loadingAI && !aiReport && (
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto py-12">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20">
                    <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">مستعد لإصدار التقرير الاستشاري</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                    اختر السهم من القائمة العلوية ثم اضغط على زر **"تشغيل التحليل الأساسي الذكي"** لبناء تقرير مالي وفني مفصل وفوري بالاعتماد على أرقام السوق وقواعد التقييم المالي الاحترافي.
                  </p>
                </div>
              )}

              {/* Loading state */}
              {loadingAI && (
                <div className="flex-1 flex flex-col items-center justify-center py-20">
                  <div className="relative mb-8">
                    {/* Ring animations */}
                    <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BrainCircuit className="h-8 w-8 text-primary animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 animate-pulse">جاري صياغة تقرير الذكاء الاصطناعي</h3>
                  <p className="text-sm text-primary/80 font-bold bg-primary/5 px-4 py-1.5 rounded-full border border-primary/15 tracking-wide max-w-xs text-center">
                    {loadingStep}
                  </p>
                </div>
              )}

              {/* Display Result */}
              {!loadingAI && aiReport && (
                <div className="flex-grow">
                  <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 bg-success rounded-full animate-ping"></span>
                      <h3 className="font-extrabold text-xl text-foreground">تقرير التحليل الاستشاري المنجز</h3>
                    </div>
                    {/* Score badge if available */}
                    {aiScore !== null && (
                      <div className={`flex items-center gap-2 border px-4 py-1.5 rounded-full text-xs font-extrabold shadow-sm ${getScoreColor(aiScore)}`}>
                        <span>التقييم العام:</span>
                        <span>{aiScore} / 100</span>
                      </div>
                    )}
                  </div>

                  {/* Render simulated markdown nicely */}
                  <div className="prose prose-invert max-w-none text-right leading-relaxed text-sm text-foreground/90 space-y-4">
                    {aiReport.split("\n").map((line, idx) => {
                      if (line.startsWith("###")) {
                        return <h3 key={idx} className="text-lg font-extrabold text-primary pt-3 pb-1">{line.replace("###", "")}</h3>;
                      }
                      if (line.startsWith("####")) {
                        return <h4 key={idx} className="text-base font-extrabold text-foreground pt-2 pb-1 border-r-2 border-primary pr-2">{line.replace("####", "")}</h4>;
                      }
                      if (line.startsWith("##")) {
                        return <h2 key={idx} className="text-xl font-extrabold text-primary border-b border-border pb-2 pt-4">{line.replace("##", "")}</h2>;
                      }
                      if (line.startsWith("*")) {
                        return (
                          <div key={idx} className="flex items-start gap-2 mr-2">
                            <span className="text-primary mt-1 text-xs">•</span>
                            <span className="flex-1">{line.replace("*", "").trim()}</span>
                          </div>
                        );
                      }
                      if (line.startsWith("---")) {
                        return <hr key={idx} className="border-border my-4" />;
                      }
                      // Check for styled recommendation block
                      if (line.includes("التوصية الحالية:")) {
                        return (
                          <div key={idx} className="p-4 bg-muted/60 border border-border/80 rounded-xl my-4 flex items-center justify-between">
                            <span className="font-extrabold text-sm">التوصية النهائية للمستشار:</span>
                            <span className="font-extrabold text-lg bg-primary/10 text-primary border border-primary/20 px-4 py-1 rounded-lg">
                              {aiRating || "احتفاظ"}
                            </span>
                          </div>
                        );
                      }
                      return <p key={idx} className="text-muted-foreground/90 whitespace-pre-wrap">{line}</p>;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Backtesting Engine */}
      {activeTab === "backtest" && (
        <div className="flex flex-col gap-8">
          {/* Backtest Parameters Card */}
          <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-extrabold text-foreground mb-6 flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-primary" /> إعدادات محاكاة الاستراتيجية الفنية
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Strategy Selector */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-muted-foreground mb-2 mr-1">الاستراتيجية الفنية:</label>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setStrategy("EMA_CROSS")}
                    className={`py-3 px-4 rounded-xl border text-right transition-all flex flex-col gap-1 ${strategy === "EMA_CROSS" ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-muted-foreground/45 bg-muted/20"}`}
                  >
                    <span className="font-extrabold text-sm text-foreground">EMA Crossover</span>
                    <span className="text-[10px] text-muted-foreground">تقاطع متوسط الحركة الأسي 9 و 21</span>
                  </button>
                  <button
                    onClick={() => setStrategy("RSI")}
                    className={`py-3 px-4 rounded-xl border text-right transition-all flex flex-col gap-1 ${strategy === "RSI" ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-muted-foreground/45 bg-muted/20"}`}
                  >
                    <span className="font-extrabold text-sm text-foreground">RSI Oversold Bounce</span>
                    <span className="text-[10px] text-muted-foreground">شراء تحت 30 وبيع عند اختراق 70</span>
                  </button>
                  <button
                    onClick={() => setStrategy("MACD")}
                    className={`py-3 px-4 rounded-xl border text-right transition-all flex flex-col gap-1 ${strategy === "MACD" ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-muted-foreground/45 bg-muted/20"}`}
                  >
                    <span className="font-extrabold text-sm text-foreground">MACD Signal Cross</span>
                    <span className="text-[10px] text-muted-foreground">تقاطع خط الماكد مع خط الإشارة</span>
                  </button>
                </div>
              </div>

              {/* Initial Capital */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-muted-foreground mb-2 mr-1">رأس المال الأولي (SAR):</label>
                <div className="relative">
                  <input
                    type="number"
                    value={initialCapital}
                    onChange={(e) => setInitialCapital(Math.max(1000, Number(e.target.value)))}
                    className="w-full bg-muted/30 border border-border focus:border-primary rounded-xl py-3 px-4 outline-none text-foreground font-bold text-sm"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-extrabold text-muted-foreground">ريال</span>
                </div>
                <p className="text-[10px] text-muted-foreground/80 mt-2 mr-1">الحد الأدنى للاختبار هو 1,000 ريال.</p>
              </div>

              {/* Timeframe selector */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-muted-foreground mb-2 mr-1">الفترة الزمنية للاختبار:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "3M", label: "3 أشهر" },
                    { id: "6M", label: "6 أشهر" },
                    { id: "1Y", label: "سنة كاملة" },
                    { id: "5Y", label: "5 سنوات" },
                  ].map((tf) => (
                    <button
                      key={tf.id}
                      onClick={() => setTimeframe(tf.id)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${timeframe === tf.id ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-muted/20 border-border text-muted-foreground hover:text-foreground"}`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Info summary */}
              <div className="md:col-span-1 flex flex-col justify-end">
                <div className="bg-muted/20 border border-dashed border-border rounded-2xl p-4">
                  <h4 className="text-xs font-extrabold text-foreground mb-2 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-primary" /> حالة المحاكاة
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    يتم جلب البيانات التاريخية اليومية لسهم **{currentStock.nameAr}** من خوادم التداول الحية ومحاكاة الصفقات التاريخية يوماً بيوم.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Loader */}
          {loadingBacktest && (
            <div className="bg-card border border-border rounded-3xl p-16 flex flex-col items-center justify-center text-center">
              <RefreshCw className="h-10 w-10 text-primary animate-spin mb-4" />
              <h3 className="text-lg font-bold">جاري تحميل البيانات التاريخية وتشغيل المحاكاة...</h3>
              <p className="text-xs text-muted-foreground mt-1">يتم إجراء فحص للشموع اليومية وحساب مؤشرات الاستراتيجية الفنية.</p>
            </div>
          )}

          {/* Error Message */}
          {backtestError && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-6 rounded-2xl flex items-center gap-3">
              <XCircle className="h-6 w-6 shrink-0" />
              <div>
                <h4 className="font-bold text-sm">حدث خطأ أثناء المحاكاة</h4>
                <p className="text-xs mt-1 leading-relaxed">{backtestError}</p>
              </div>
            </div>
          )}

          {/* Backtest Results */}
          {!loadingBacktest && backtestResult && (
            <div className="flex flex-col gap-8">
              {/* Performance Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Final Capital Card */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 p-3 opacity-5">
                    <Coins className="h-16 w-16 text-foreground" />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground block mb-2">رأس المال النهائي</span>
                  <span className="text-2xl font-extrabold text-foreground block tracking-tight">
                    {formatCurrency(backtestResult.finalCapital)}
                  </span>
                  <span className="text-[10px] text-muted-foreground block mt-2">
                    المبلغ البدائي: {formatCurrency(backtestResult.initialCapital)}
                  </span>
                </div>

                {/* Strategy Return Card */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 p-3 opacity-5">
                    <TrendingUp className="h-16 w-16 text-foreground" />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground block mb-2">عائد الاستراتيجية</span>
                  <span className={`text-2xl font-extrabold block tracking-tight ${backtestResult.totalReturnPercent >= 0 ? "text-success" : "text-destructive"}`}>
                    {backtestResult.totalReturnPercent >= 0 ? "+" : ""}{backtestResult.totalReturnPercent.toFixed(2)}%
                  </span>
                  <span className={`text-[10px] font-bold block mt-2 ${backtestResult.totalReturnSAR >= 0 ? "text-success" : "text-destructive"}`}>
                    {backtestResult.totalReturnSAR >= 0 ? "+" : ""}{formatCurrency(backtestResult.totalReturnSAR)}
                  </span>
                </div>

                {/* Buy & Hold Return Card */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <span className="text-xs font-bold text-muted-foreground block mb-2">عائد شراء واحتفاظ بالسهم (B&H)</span>
                  <span className={`text-2xl font-extrabold block tracking-tight ${backtestResult.buyAndHoldReturnPercent >= 0 ? "text-success" : "text-destructive"}`}>
                    {backtestResult.buyAndHoldReturnPercent >= 0 ? "+" : ""}{backtestResult.buyAndHoldReturnPercent.toFixed(2)}%
                  </span>
                  <span className={`text-[10px] font-bold block mt-2 ${backtestResult.buyAndHoldReturnSAR >= 0 ? "text-success" : "text-destructive"}`}>
                    {backtestResult.buyAndHoldReturnSAR >= 0 ? "+" : ""}{formatCurrency(backtestResult.buyAndHoldReturnSAR)}
                  </span>
                </div>

                {/* Win Rate Card */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <span className="text-xs font-bold text-muted-foreground block mb-2">نسبة الصفقات الناجحة</span>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-extrabold text-primary">
                      {backtestResult.winRate}%
                    </span>
                    {/* Tiny visual progress bar */}
                    <div className="w-12 h-12 rounded-full border-4 border-muted flex items-center justify-center relative">
                      <div 
                        className="absolute inset-[-4px] rounded-full border-4 border-primary border-t-transparent border-l-transparent" 
                        style={{ transform: `rotate(${(backtestResult.winRate / 100) * 360}deg)` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground block mt-2">
                    {backtestResult.winningTrades} رابحة من إجمالي {backtestResult.totalTrades} صفقات
                  </span>
                </div>
              </div>

              {/* Equity Curve SVG Chart */}
              <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" /> منحنى نمو رأس المال مقارنة مع السوق
                </h3>

                {/* Interactive SVG Chart wrapper */}
                <div className="w-full h-80 relative bg-muted/10 rounded-2xl border border-border p-4 flex flex-col justify-between overflow-hidden">
                  <div className="absolute top-4 left-4 flex gap-4 text-xs font-bold z-10">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-primary rounded-full"></span>
                      <span className="text-foreground">الاستراتيجية الفنية</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-muted-foreground/60 rounded-full"></span>
                      <span className="text-muted-foreground">شراء واحتفاظ بالصندوق</span>
                    </div>
                  </div>

                  {/* Render smooth SVG Chart path */}
                  <svg className="w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="strategyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2"/>
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0"/>
                      </linearGradient>
                    </defs>

                    {/* Gridlines */}
                    <line x1="0" y1="50" x2="1000" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="0" y1="150" x2="1000" y2="150" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="0" y1="250" x2="1000" y2="250" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                    {/* Path plotting */}
                    {(() => {
                      const len = backtestResult.equityCurve.length;
                      if (len === 0) return null;

                      const minCap = Math.min(
                        ...backtestResult.equityCurve.map((c) => Math.min(c.capital, c.buyAndHoldCapital))
                      );
                      const maxCap = Math.max(
                        ...backtestResult.equityCurve.map((c) => Math.max(c.capital, c.buyAndHoldCapital))
                      );
                      const range = maxCap - minCap || 1;

                      // Map points to SVG coordinates
                      const getCoordinates = (curveType: "capital" | "buyAndHoldCapital") => {
                        return backtestResult.equityCurve.map((pt, idx) => {
                          const x = (idx / (len - 1)) * 1000;
                          const val = curveType === "capital" ? pt.capital : pt.buyAndHoldCapital;
                          // Height logic: invert Y coordinate since SVG (0,0) is top-left
                          const y = 250 - ((val - minCap) / range) * 200;
                          return `${x},${y}`;
                        }).join(" ");
                      };

                      const strategyPoints = getCoordinates("capital");
                      const bhPoints = getCoordinates("buyAndHoldCapital");

                      return (
                        <>
                          {/* Buy & Hold Line */}
                          <polyline
                            fill="none"
                            stroke="rgba(150, 150, 150, 0.3)"
                            strokeWidth="2"
                            strokeDasharray="4,4"
                            points={bhPoints}
                          />

                          {/* Strategy Gradient Fill */}
                          <path
                            fill="url(#strategyGrad)"
                            d={`M 0,280 L ${strategyPoints} L 1000,280 Z`}
                          />

                          {/* Strategy Line */}
                          <polyline
                            fill="none"
                            stroke="hsl(var(--primary))"
                            strokeWidth="3.5"
                            points={strategyPoints}
                          />
                        </>
                      );
                    })()}
                  </svg>

                  {/* X axis dates */}
                  <div className="flex justify-between text-[9px] text-muted-foreground font-mono mt-2 pt-2 border-t border-border/40">
                    <span>{backtestResult.equityCurve[0]?.time}</span>
                    <span>{backtestResult.equityCurve[Math.floor(backtestResult.equityCurve.length / 2)]?.time}</span>
                    <span>{backtestResult.equityCurve[backtestResult.equityCurve.length - 1]?.time}</span>
                  </div>
                </div>
              </div>

              {/* Detailed Trades Log */}
              <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" /> سجل صفقات الاستراتيجية المنفذة
                </h3>
                
                {backtestResult.trades.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-right text-sm">
                      <thead className="bg-muted/30 text-xs font-bold text-muted-foreground border-b border-border">
                        <tr>
                          <th className="px-6 py-4">التاريخ</th>
                          <th className="px-6 py-4">نوع الصفقة</th>
                          <th className="px-6 py-4">سعر التنفيذ</th>
                          <th className="px-6 py-4">العائد %</th>
                          <th className="px-6 py-4">الربح بالريال</th>
                          <th className="px-6 py-4">فترة الاحتفاظ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {backtestResult.trades.map((trade, idx) => (
                          <tr key={idx} className="hover:bg-muted/10 transition-colors">
                            <td className="px-6 py-4 font-mono text-xs">{trade.date}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-0.5 rounded text-xs font-extrabold ${trade.type === "BUY" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                                {trade.type === "BUY" ? "شراء" : "بيع"}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold">{trade.price.toFixed(2)} ر.س</td>
                            <td className="px-6 py-4">
                              {trade.type === "SELL" ? (
                                <span className={`font-bold ${trade.profitPercent! >= 0 ? "text-success" : "text-destructive"}`}>
                                  {trade.profitPercent! >= 0 ? "+" : ""}{trade.profitPercent}%
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {trade.type === "SELL" ? (
                                <span className={`font-bold ${trade.profitSAR! >= 0 ? "text-success" : "text-destructive"}`}>
                                  {trade.profitSAR! >= 0 ? "+" : ""}{formatCurrency(trade.profitSAR!)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-xs text-muted-foreground">
                              {trade.type === "SELL" ? `${trade.holdingDays} يوماً` : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-muted-foreground bg-muted/10 border border-dashed border-border rounded-xl">
                    لم تنفذ الاستراتيجية الفنية أي صفقات بيع أو شراء خلال فترة الاختبار المحددة.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
