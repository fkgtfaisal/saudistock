"use client";

import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Minus, 
  Search, 
  Loader2, 
  Sparkles,
  PieChart as ChartIcon,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { SAUDI_STOCKS, StockInfo } from "@/lib/stocks";

interface PortfolioItem {
  id: string;
  symbol: string;
  nameAr: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalCost: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

interface PortfolioData {
  portfolioId: string;
  name: string;
  cashBalance: number;
  totalEquityValue: number;
  totalPortfolioValue: number;
  items: PortfolioItem[];
}

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [trading, setTrading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  
  // Mounted check to prevent Recharts SSR issues
  const [mounted, setMounted] = useState(false);

  // Trading Modal States
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [tradeType, setTradeType] = useState<"BUY" | "SELL">("BUY");
  const [selectedStock, setSelectedStock] = useState<StockInfo | null>(null);
  const [stockSearchQuery, setStockSearchQuery] = useState("");
  const [tradeQuantity, setTradeQuantity] = useState("");
  const [livePriceEstimate, setLivePriceEstimate] = useState<number | null>(null);
  const [fetchingPrice, setFetchingPrice] = useState(false);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    setMounted(true);
    fetchPortfolio();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Fetch portfolio data
  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/portfolio");
      if (!res.ok) throw new Error("Failed to fetch portfolio");
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
      showToast("فشل تحميل بيانات المحفظة.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch live price estimate when selecting a stock
  useEffect(() => {
    if (!selectedStock) {
      setLivePriceEstimate(null);
      return;
    }

    const fetchPrice = async () => {
      setFetchingPrice(true);
      try {
        const ticker = selectedStock.symbol.endsWith(".SR") ? selectedStock.symbol : `${selectedStock.symbol}.SR`;
        // Fetch from market API
        const res = await fetch("/api/market");
        if (res.ok) {
          const marketData = await res.json();
          const stock = marketData.stocks?.find((s: any) => s.symbol === selectedStock.symbol);
          if (stock && stock.price !== null) {
            setLivePriceEstimate(stock.price);
          } else {
            // Fallback or estimated close
            setLivePriceEstimate(34.50); // Default placeholder
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setFetchingPrice(false);
      }
    };

    fetchPrice();
  }, [selectedStock]);

  const handleExecuteTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock) {
      showToast("يرجى اختيار سهم أولاً", "error");
      return;
    }
    const qty = parseFloat(tradeQuantity);
    if (isNaN(qty) || qty <= 0) {
      showToast("يرجى إدخال كمية صحيحة", "error");
      return;
    }

    setTrading(true);
    try {
      const res = await fetch("/api/portfolio/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: `${selectedStock.symbol}.SR`,
          type: tradeType,
          quantity: qty
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to execute trade");
      }

      showToast(`${resData.message} | السعر: ${resData.executionPrice.toFixed(2)} ر.س | القيمة: ${resData.totalCost.toFixed(2)} ر.س`, "success");
      setIsTradeModalOpen(false);
      setTradeQuantity("");
      setSelectedStock(null);
      
      // Reload Portfolio
      fetchPortfolio();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "فشلت عملية التداول.", "error");
    } finally {
      setTrading(false);
    }
  };

  const openTradeModal = (type: "BUY" | "SELL", stock?: PortfolioItem) => {
    setTradeType(type);
    if (stock) {
      const matched = SAUDI_STOCKS.find(s => s.symbol === stock.symbol.replace(".SR", ""));
      if (matched) {
        setSelectedStock(matched);
      } else {
        setSelectedStock({
          symbol: stock.symbol.replace(".SR", ""),
          yahooTicker: stock.symbol,
          nameAr: stock.nameAr,
          nameEn: stock.symbol,
          sector: "تداول"
        });
      }
    } else {
      setSelectedStock(null);
    }
    setIsTradeModalOpen(true);
  };

  // Filter stocks based on query
  const filteredStocks = SAUDI_STOCKS.filter(stock => 
    stock.nameAr.includes(stockSearchQuery) || 
    stock.symbol.includes(stockSearchQuery) ||
    stock.nameEn.toLowerCase().includes(stockSearchQuery.toLowerCase())
  ).slice(0, 5);

  // Portfolio total gain/loss calculations
  const totalCost = data?.items.reduce((sum, item) => sum + item.totalCost, 0) || 0;
  const totalValue = data?.items.reduce((sum, item) => sum + item.currentValue, 0) || 0;
  const netProfitLoss = totalValue - totalCost;
  const netProfitLossPercent = totalCost > 0 ? (netProfitLoss / totalCost) * 100 : 0;

  // Colors for Recharts Pie Allocation
  const COLORS = ["#d4af37", "#0ea5e9", "#10b981", "#ec4899", "#8b5cf6", "#f59e0b", "#ef4444"];

  // Prepare chart data (holdings)
  const chartData = data?.items.map(item => ({
    name: item.nameAr,
    value: item.currentValue
  })) || [];

  // Add Cash as a slice if positive
  if (data && data.cashBalance > 0) {
    chartData.push({
      name: "الرصيد النقدي (كاش)",
      value: data.cashBalance
    });
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-fade-in relative" dir="rtl">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-6 z-[250] border shadow-2xl rounded-2xl p-4 flex items-center gap-3 animate-slide-up duration-300 max-w-md ${
          toast.type === "success" ? "bg-slate-900 border-emerald-500/30 text-emerald-400" :
          toast.type === "error" ? "bg-slate-900 border-rose-500/30 text-rose-400" :
          "bg-slate-900 border-slate-700 text-slate-300"
        }`}>
          {toast.type === "success" && <CheckCircle2 className="h-5 w-5 flex-shrink-0" />}
          {toast.type === "error" && <AlertCircle className="h-5 w-5 flex-shrink-0" />}
          <span className="text-sm font-semibold leading-relaxed">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 bg-card border border-border p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black mb-1 bg-gradient-to-l from-white to-slate-400 bg-clip-text text-transparent">
              محاكي التداول والمحفظة الاستثمارية
            </h1>
            <p className="text-sm text-muted-foreground">
              تداول في السوق السعودي ببيانات أسعار حية ورصيد افتراضي قدره 100,000 ريال سعودي.
            </p>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={fetchPortfolio}
            className="p-3 border border-border hover:bg-slate-800 text-slate-300 rounded-xl transition-all"
            title="تحديث البيانات"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          
          <button 
            onClick={() => openTradeModal("BUY")}
            className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground px-5 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            شراء أسهم
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center text-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">جاري تقييم المحفظة الاستثمارية وحساب الأرباح والخسائر الفورية...</p>
        </div>
      ) : !data ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center shadow-xl">
          <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground">حدث خطأ أثناء تحميل المحفظة</h3>
          <p className="text-sm text-muted-foreground mt-2">يرجى التحقق من تسجيل دخولك وتحديث الصفحة.</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Portfolio Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Net Liquidity */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
              <p className="text-xs text-muted-foreground font-bold mb-1">صافي قيمة المحفظة</p>
              <h3 className="text-2xl font-black text-foreground font-mono">
                {data.totalPortfolioValue.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س
              </h3>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                الكاش + القيمة السوقية للأسهم
              </p>
            </div>

            {/* Virtual Cash */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <p className="text-xs text-muted-foreground font-bold mb-1">الرصيد النقدي المتاح (كاش)</p>
              <h3 className="text-2xl font-black text-primary font-mono">
                {data.cashBalance.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س
              </h3>
              <p className="text-xs text-muted-foreground mt-2">جاهز للاستثمار والشراء الفوري</p>
            </div>

            {/* Total Equity held */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <p className="text-xs text-muted-foreground font-bold mb-1">القيمة السوقية للأسهم</p>
              <h3 className="text-2xl font-black text-slate-100 font-mono">
                {data.totalEquityValue.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س
              </h3>
              <p className="text-xs text-muted-foreground mt-2">إجمالي قيمة مركزك في الأسهم</p>
            </div>

            {/* Total Unrealized Profit/Loss */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <p className="text-xs text-muted-foreground font-bold mb-1">الأرباح والخسائر غير المحققة</p>
              <div className="flex items-baseline gap-2">
                <h3 className={`text-2xl font-black font-mono ${netProfitLoss >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {netProfitLoss >= 0 ? "+" : ""}{netProfitLoss.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س
                </h3>
              </div>
              <p className={`text-xs font-bold mt-2 flex items-center gap-1 ${netProfitLoss >= 0 ? "text-emerald-400/90" : "text-rose-400/90"}`}>
                {netProfitLoss >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                <span>({netProfitLossPercent.toFixed(2)}%) منذ البداية</span>
              </p>
            </div>

          </div>

          {/* Allocation & Trading Form Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Recharts Allocation Card */}
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-xl flex flex-col justify-between min-h-[350px]">
              <div>
                <h3 className="font-black text-base text-foreground mb-1 flex items-center gap-2">
                  <ChartIcon className="h-5 w-5 text-primary" />
                  توزيع أصول المحفظة (النسب المئوية)
                </h3>
                <p className="text-xs text-muted-foreground mb-4">يعرض لك نسبة السيولة النقدية مقابل الاستثمارات في مختلف الأسهم.</p>
              </div>

              <div className="flex-1 w-full min-h-[220px] relative">
                {mounted && chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "#0b0f19", 
                          borderColor: "#1e293b", 
                          borderRadius: "12px", 
                          color: "#fff",
                          textAlign: "right"
                        }} 
                        formatter={(value: any) => [`${parseFloat(value).toFixed(2)} ر.س`, "القيمة السوقية"]}
                      />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                    لا تتوفر أصول كافية لرسم الرسم البياني. اشتر بعض الأسهم لتجربة الميزة!
                  </div>
                )}
              </div>
            </div>

            {/* Quick Trading Tips Sidebar */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="font-black text-base text-foreground mb-2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  قواعد التداول التجريبي
                </h3>
                <div className="text-xs text-muted-foreground space-y-3 leading-relaxed mt-4">
                  <p><strong>1. الأسعار حية:</strong> تنفذ عمليات الشراء والبيع افتراضياً بالاعتماد على أسعار السوق الفورية الحقيقية المسحوبة من ياهو فاينانس مباشرةً.</p>
                  <p><strong>2. رأس المال الافتراضي:</strong> تبدأ بـ 100,000 ريال كاش ويمكنك إعادة الاستثمار ببيع الأسهم التي ربحت بها.</p>
                  <p><strong>3. حساب المتوسط:</strong> عند شرائك لرمز سهم تملكه مسبقاً، يقوم النظام تلقائياً بإعادة حساب متوسط الشراء لحساب أرباحك الصافية بدقة.</p>
                </div>
              </div>

              <div className="pt-6 border-t border-border mt-4">
                <button
                  onClick={() => openTradeModal("BUY")}
                  className="w-full bg-slate-900 border border-border hover:bg-slate-800 text-foreground py-3.5 rounded-xl font-bold transition-all text-xs"
                >
                  افتح لوحة التداول الفورية
                </button>
              </div>
            </div>

          </div>

          {/* Current Holdings Table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-border bg-slate-900/40 flex justify-between items-center">
              <h3 className="font-extrabold text-base text-foreground">الأسهم المملوكة حالياً بالمحفظة</h3>
              <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full font-black">
                {data.items.length} شركات
              </span>
            </div>

            {data.items.length === 0 ? (
              <div className="py-16 text-center">
                <Wallet className="h-10 w-10 text-muted-foreground mx-auto mb-3 animate-pulse" />
                <h4 className="font-bold text-foreground mb-1">محفظتك فارغة حالياً</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  لم تقم بشراء أي أسهم افتراضية حتى الآن. انقر على زر شراء أسهم بالأعلى لبناء محفظتك التنافسية!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900/60 border-b border-border/80 text-muted-foreground font-bold">
                    <tr>
                      <th className="p-4">الرمز والشركة</th>
                      <th className="p-4 text-center">الكمية</th>
                      <th className="p-4 text-center">متوسط الشراء</th>
                      <th className="p-4 text-center">السعر الحالي</th>
                      <th className="p-4 text-center">التكلفة الكلية</th>
                      <th className="p-4 text-center">القيمة السوقية</th>
                      <th className="p-4 text-center">الأرباح والخسائر</th>
                      <th className="p-4 text-left">إجراءات تداول</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-slate-200">
                    {data.items.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                        <td className="p-4">
                          <div>
                            <span className="font-black text-sm text-foreground">{item.symbol.replace(".SR", "")}</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">{item.nameAr}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center font-mono font-bold">{item.quantity}</td>
                        <td className="p-4 text-center font-mono">{item.averagePrice.toFixed(2)} ر.س</td>
                        <td className="p-4 text-center font-mono font-bold text-slate-100">{item.currentPrice.toFixed(2)} ر.س</td>
                        <td className="p-4 text-center font-mono">{(item.totalCost).toFixed(2)} ر.س</td>
                        <td className="p-4 text-center font-mono font-bold">{(item.currentValue).toFixed(2)} ر.س</td>
                        <td className="p-4 text-center font-mono">
                          <span className={`font-black ${item.profitLoss >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {item.profitLoss >= 0 ? "+" : ""}{item.profitLoss.toFixed(2)} ر.س
                          </span>
                          <span className={`text-[10px] block mt-0.5 ${item.profitLoss >= 0 ? "text-emerald-400/80" : "text-rose-400/80"}`}>
                            ({item.profitLossPercent >= 0 ? "+" : ""}{item.profitLossPercent.toFixed(2)}%)
                          </span>
                        </td>
                        <td className="p-4 text-left">
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => openTradeModal("BUY", item)}
                              className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 px-2.5 py-1.5 rounded-lg font-bold text-[10px] transition-all flex items-center gap-1"
                            >
                              <Plus className="h-3 w-3" /> تعزيز
                            </button>
                            <button
                              onClick={() => openTradeModal("SELL", item)}
                              className="bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 px-2.5 py-1.5 rounded-lg font-bold text-[10px] transition-all flex items-center gap-1"
                            >
                              <Minus className="h-3 w-3" /> تخفيف
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Trade Modal (BUY / SELL Panel) */}
      {isTradeModalOpen && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-4 transition-all duration-300"
          onClick={() => setIsTradeModalOpen(false)}
        >
          <div 
            role="dialog"
            aria-modal="true"
            className="bg-card border border-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-zoom-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl text-foreground ${tradeType === "BUY" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border border-rose-500/20 text-rose-400"}`}>
                  <Wallet className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-lg text-foreground">
                  لوحة التداول الفوري: {tradeType === "BUY" ? "أمر شراء أسهم" : "أمر بيع أسهم"}
                </h3>
              </div>
              <button 
                onClick={() => setIsTradeModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-xl hover:bg-slate-800/60 transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleExecuteTrade} className="p-6 space-y-6">
              
              {/* BUY / SELL Switcher */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTradeType("BUY")}
                  className={`p-3.5 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
                    tradeType === "BUY"
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                      : "bg-slate-900 border-border text-muted-foreground hover:bg-slate-800"
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  أمر شراء (BUY)
                </button>

                <button
                  type="button"
                  onClick={() => setTradeType("SELL")}
                  className={`p-3.5 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
                    tradeType === "SELL"
                      ? "bg-rose-500/10 border-rose-500 text-rose-400"
                      : "bg-slate-900 border-border text-muted-foreground hover:bg-slate-800"
                  }`}
                >
                  <Minus className="h-4 w-4" />
                  أمر بيع (SELL)
                </button>
              </div>

              {/* Select Stock */}
              <div className="space-y-2 relative">
                <label className="text-sm font-semibold text-slate-300">
                  ابحث عن السهم بالرمز أو الاسم
                </label>
                
                {selectedStock ? (
                  <div className="flex items-center justify-between bg-primary/5 border border-primary/30 rounded-xl p-3.5 text-sm">
                    <span className="font-bold text-foreground">
                      {selectedStock.symbol} - {selectedStock.nameAr}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setSelectedStock(null)}
                      className="text-primary hover:text-rose-400 font-bold text-xs"
                    >
                      تغيير الشركة
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input 
                        type="text"
                        value={stockSearchQuery}
                        onChange={(e) => setStockSearchQuery(e.target.value)}
                        placeholder="ابحث برقم الرمز أو اسم الشركة..."
                        className="w-full bg-slate-900 border border-border rounded-xl pr-10 pl-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                      />
                    </div>

                    {stockSearchQuery && (
                      <div className="absolute z-10 w-full bg-slate-900 border border-border rounded-xl mt-1 shadow-2xl divide-y divide-border overflow-hidden">
                        {filteredStocks.length === 0 ? (
                          <div className="p-3 text-sm text-muted-foreground text-center">
                            لا توجد شركات مطابقة لبحثك
                          </div>
                        ) : (
                          filteredStocks.map((stock) => (
                            <button
                              key={stock.symbol}
                              type="button"
                              onClick={() => {
                                setSelectedStock(stock);
                                setStockSearchQuery("");
                              }}
                              className="w-full text-right p-3.5 text-sm hover:bg-primary/10 transition-colors flex justify-between items-center"
                            >
                              <span className="font-bold text-foreground">{stock.nameAr}</span>
                              <span className="text-xs text-muted-foreground bg-slate-800 border border-border px-2 py-0.5 rounded font-mono">{stock.symbol}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Quantity Input */}
              <div className="space-y-2">
                <label htmlFor="trade-quantity" className="text-sm font-semibold text-slate-300 flex justify-between">
                  <span>كمية الأسهم</span>
                  {selectedStock && data && tradeType === "SELL" && (
                    <span className="text-xs text-muted-foreground">
                      المملوك حالياً: {data.items.find(i => i.symbol.startsWith(selectedStock.symbol))?.quantity || 0} سهم
                    </span>
                  )}
                </label>
                <input 
                  id="trade-quantity"
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={tradeQuantity}
                  onChange={(e) => setTradeQuantity(e.target.value)}
                  placeholder="أدخل عدد الأسهم (مثال: 10)"
                  className="w-full bg-slate-900 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground font-mono text-center"
                />
              </div>

              {/* Real-time Order Summary */}
              {selectedStock && (
                <div className="bg-slate-900/60 border border-border rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">سعر السهم الافتراضي المقدر:</span>
                    {fetchingPrice ? (
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    ) : (
                      <span className="font-bold font-mono">{livePriceEstimate ? `${livePriceEstimate.toFixed(2)} ر.س` : "جاري التحميل..."}</span>
                    )}
                  </div>
                  <div className="flex justify-between border-t border-border/40 pt-2 text-sm font-black">
                    <span className="text-slate-300">القيمة الإجمالية التقريبية للصفقة:</span>
                    <span className="text-primary font-mono">
                      {livePriceEstimate && tradeQuantity ? `${(livePriceEstimate * parseFloat(tradeQuantity || "0")).toLocaleString("ar-SA", { minimumFractionDigits: 2 })} ر.س` : "0.00 ر.س"}
                    </span>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border bg-slate-900/20 -mx-6 -mb-6 p-6">
                <button
                  type="submit"
                  disabled={trading || !selectedStock || !tradeQuantity}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
                    tradeType === "BUY" 
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/10" 
                      : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/10"
                  }`}
                >
                  {trading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري التنفيذ...
                    </>
                  ) : (
                    tradeType === "BUY" ? "تنفيذ الشراء الفوري" : "تنفيذ البيع الفوري"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsTradeModalOpen(false)}
                  className="flex-1 bg-slate-900 border border-border hover:bg-slate-800 text-slate-300 py-3 rounded-xl font-bold transition-all duration-200 text-sm"
                >
                  إلغاء
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
